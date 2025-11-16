const movieRepository = require('../repositories/movieRepository');
const { getCacheService } = require('./cacheService');
const { getKafkaService } = require('./kafkaService');
const { getResilienceService } = require('./resilienceService');

const cacheService = getCacheService();
const kafkaService = getKafkaService();
const resilienceService = getResilienceService();

class MovieService {
  /**
   * Obtener todas las películas con caché y Circuit Breaker
   */
  async getAllMovies(page, limit) {
    const cacheKey = `movies:all:page:${page}:limit:${limit}`;
    
    console.log(`[DEBUG] getAllMovies - Looking for cache key: ${cacheKey}`);
    
    // Intentar obtener del caché primero
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`✓ Serving ${cached.movies?.length || 0} movies from cache`);
      return { ...cached, fromCache: true, degradedMode: false };
    }
    
    console.log('[DEBUG] Cache miss - Attempting database query');

    // Si no está en caché, intentar obtener de BD con Circuit Breaker
    try {
      const operation = async () => {
        console.log('[DEBUG] Executing database query...');
        const result = await movieRepository.findAll(page, limit);
        console.log(`[DEBUG] Got ${result.movies?.length || 0} movies from DB - Caching with key: ${cacheKey}`);
        // Guardar en caché
        await cacheService.cacheMovies(cacheKey, result, cacheService.POPULAR_MOVIES_TTL);
        console.log(`[DEBUG] Movies cached successfully with TTL: ${cacheService.POPULAR_MOVIES_TTL}s`);
        return { ...result, fromCache: false, degradedMode: false };
      };

      return await resilienceService.executeWithFallback(
        'getAllMovies',
        operation,
        null
      );
    } catch (error) {
      // Si Circuit Breaker está abierto, buscar en caché cualquier versión
      console.log('⚠️ Database unavailable - Searching for any cached version');
      const cachedFallback = await cacheService.get(cacheKey);
      if (cachedFallback) {
        console.log('✓ Serving movies from cache (fallback)');
        return { ...cachedFallback, fromCache: true, degradedMode: true };
      }
      
      console.log('⚠️ No cache available - Returning empty result');
      return {
        movies: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        },
        fromCache: false,
        degradedMode: true
      };
    }
  }

  /**
   * Obtener película por ID con caché y Circuit Breaker
   */
  async getMovieById(movieId) {
    // Intentar obtener del caché primero
    const cached = await cacheService.getMovieDetails(movieId);
    if (cached) {
      console.log(`✓ Serving movie ${movieId} from cache`);
      return cached;
    }

    // Si no está en caché, intentar obtener de BD con Circuit Breaker
    try {
      const operation = async () => {
        const movie = await movieRepository.findById(movieId);
        if (!movie) {
          throw new Error('Movie not found');
        }
        // Guardar en caché
        await cacheService.cacheMovieDetails(movieId, movie);
        return movie;
      };

      return await resilienceService.executeWithFallback(
        'getMovieById',
        operation,
        null
      );
    } catch (error) {
      console.log(`⚠️ Database unavailable - Movie ${movieId} not in cache`);
      throw new Error('Movie not available - Database is down');
    }
  }

  /**
   * Obtener películas por género con caché
   */
  async getMoviesByGenre(genreId, page, limit) {
    const cacheKey = `movies:genre:${genreId}:page:${page}:limit:${limit}`;
    
    // Verificar caché primero
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`✓ Serving movies for genre ${genreId} from cache`);
      return { ...cached, fromCache: true, degradedMode: false };
    }

    try {
      const operation = async () => {
        const result = await movieRepository.findByGenre(genreId, page, limit);
        await cacheService.cacheMovies(cacheKey, result);
        return { ...result, fromCache: false, degradedMode: false };
      };

      return await resilienceService.executeWithFallback(
        'getMoviesByGenre',
        operation,
        null
      );
    } catch (error) {
      // Si falla, buscar en caché o retornar vacío
      console.log(`⚠️ Database unavailable for genre ${genreId} - Checking cache again`);
      const cachedFallback = await cacheService.get(cacheKey);
      if (cachedFallback) {
        console.log(`✓ Serving genre ${genreId} movies from cache (fallback)`);
        return { ...cachedFallback, fromCache: true, degradedMode: true };
      }

      return {
        movies: [],
        pagination: { currentPage: page, totalPages: 0, totalItems: 0, itemsPerPage: limit },
        fromCache: false,
        degradedMode: true
      };
    }
  }

  /**
   * Buscar películas con caché
   */
  async searchMovies(query, page, limit) {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    const cacheKey = `search:${query.toLowerCase()}:page:${page}`;
    
    const cached = await cacheService.getSearchResults(query);
    if (cached) {
      console.log(`✓ Serving search results for "${query}" from cache`);
      return cached;
    }

    try {
      const operation = async () => {
        const result = await movieRepository.searchByTitle(query, page, limit);
        await cacheService.cacheSearchResults(query, result);
        return result;
      };

      return await resilienceService.executeWithFallback(
        'searchMovies',
        operation,
        null
      );
    } catch (error) {
      console.log(`⚠️ Database unavailable for search "${query}"`);
      return {
        movies: [],
        pagination: { currentPage: page, totalPages: 0, totalItems: 0, itemsPerPage: limit },
        fromCache: false,
        degradedMode: true
      };
    }
  }

  async getMoviesByDirector(director, page, limit) {
    return await movieRepository.findByDirector(director, page, limit);
  }

  async getMoviesByYear(year, page, limit) {
    const currentYear = new Date().getFullYear();
    if (year < 1888 || year > currentYear) {
      throw new Error(`Invalid year. Must be between 1888 and ${currentYear}`);
    }
    return await movieRepository.findByYear(year, page, limit);
  }

  /**
   * Crear película con Kafka para escritura asíncrona
   */
  async createMovie(movieData) {
    // Validaciones básicas
    if (!movieData.title || !movieData.release_date) {
      throw new Error('Missing required fields: title, release_date');
    }

    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log('⚠️ Database down - Sending movie creation to Kafka queue');
      
      await kafkaService.sendMovieUpdate(null, {
        action: 'CREATE',
        data: movieData
      });

      return {
        message: 'Movie creation queued successfully',
        queued: true,
        data: movieData
      };
    }

    // Si la BD está disponible, crear directamente
    try {
      const movie = await movieRepository.create(movieData);

      // Asociar géneros si se proporcionan
      if (movieData.genres && movieData.genres.length > 0) {
        await movieRepository.associateGenres(movie.id, movieData.genres);
      }

      const fullMovie = await movieRepository.findById(movie.id);
      
      // Cachear la nueva película
      await cacheService.cacheMovieDetails(movie.id, fullMovie);
      
      // Invalidar caché de listas
      await cacheService.delPattern('movies:*');

      return fullMovie;
    } catch (error) {
      // Si falla, enviar a Kafka como fallback
      console.log('⚠️ Database error - Sending to Kafka as fallback');
      await kafkaService.sendMovieUpdate(null, {
        action: 'CREATE',
        data: movieData
      });

      return {
        message: 'Movie creation queued due to error',
        queued: true,
        data: movieData
      };
    }
  }

  /**
   * Actualizar película con Kafka para escritura asíncrona
   */
  async updateMovie(movieId, movieData) {
    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log(`⚠️ Database down - Sending movie ${movieId} update to Kafka queue`);
      
      await kafkaService.sendMovieUpdate(movieId, movieData);

      return {
        message: 'Movie update queued successfully',
        queued: true,
        movieId,
        data: movieData
      };
    }

    // Si la BD está disponible, actualizar directamente
    try {
      const movie = await movieRepository.update(movieId, movieData);
      if (!movie) {
        throw new Error('Movie not found');
      }

      // Actualizar géneros si se proporcionan
      if (movieData.genres) {
        await movieRepository.associateGenres(movieId, movieData.genres);
      }

      const updatedMovie = await movieRepository.findById(movieId);
      
      // Actualizar caché
      await cacheService.cacheMovieDetails(movieId, updatedMovie);
      await cacheService.delPattern('movies:*');

      return updatedMovie;
    } catch (error) {
      // Si falla, enviar a Kafka como fallback
      console.log(`⚠️ Database error - Sending movie ${movieId} update to Kafka`);
      await kafkaService.sendMovieUpdate(movieId, movieData);

      return {
        message: 'Movie update queued due to error',
        queued: true,
        movieId,
        data: movieData
      };
    }
  }

  /**
   * Eliminar película
   */
  async deleteMovie(movieId) {
    const deleted = await movieRepository.delete(movieId);
    if (!deleted) {
      throw new Error('Movie not found');
    }

    // Invalidar caché
    await cacheService.invalidateMovie(movieId);

    return { message: 'Movie deleted successfully' };
  }
}

module.exports = new MovieService();
