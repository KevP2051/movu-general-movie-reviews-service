const genreRepository = require('../repositories/genreRepository');
const { getCacheService } = require('./cacheService');
const { getResilienceService } = require('./resilienceService');

const cacheService = getCacheService();
const resilienceService = getResilienceService();

class GenreService {
  /**
   * Obtener todos los géneros con caché y Circuit Breaker
   */
  async getAllGenres() {
    const cacheKey = 'genres:all';
    
    // Intentar obtener del caché primero
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('✓ Serving genres from cache');
      return cached;
    }

    // Si no está en caché, intentar obtener de BD con Circuit Breaker
    try {
      const operation = async () => {
        const genres = await genreRepository.findAll();
        // Guardar en caché (24 horas para géneros, cambian poco)
        await cacheService.set(cacheKey, genres, 86400);
        return genres;
      };

      return await resilienceService.executeWithFallback(
        'getAllGenres',
        operation,
        null
      );
    } catch (error) {
      console.log('⚠️ Database unavailable - Checking cache again');
      const cachedFallback = await cacheService.get(cacheKey);
      if (cachedFallback) {
        console.log('✓ Serving genres from cache (fallback)');
        return cachedFallback;
      }
      console.log('⚠️ No genres available in cache');
      return [];
    }
  }

  /**
   * Obtener géneros con conteo de películas con caché y Circuit Breaker
   */
  async getAllGenresWithMovieCount() {
    const cacheKey = 'genres:with-movie-count';
    
    // Intentar obtener del caché primero
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('✓ Serving genres with movie count from cache');
      return cached;
    }

    // Si no está en caché, intentar obtener de BD con Circuit Breaker
    const fallback = async () => {
      console.log('⚠️ Database unavailable - Returning empty genres with counts');
      return [];
    };

    const operation = async () => {
      const genres = await genreRepository.findAllWithMovieCount();
      // Guardar en caché (1 hora, cambia con películas)
      await cacheService.set(cacheKey, genres, 3600);
      return genres;
    };

    return await resilienceService.executeWithFallback(
      'getAllGenresWithMovieCount',
      operation,
      fallback
    );
  }

  /**
   * Obtener género por ID con caché y Circuit Breaker
   */
  async getGenreById(genreId) {
    const cacheKey = `genre:${genreId}`;
    
    // Intentar obtener del caché primero
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`✓ Serving genre ${genreId} from cache`);
      return cached;
    }

    // Si no está en caché, intentar obtener de BD con Circuit Breaker
    const fallback = async () => {
      console.log(`⚠️ Database unavailable - Genre ${genreId} not in cache`);
      throw new Error('Genre not available - Database is down');
    };

    const operation = async () => {
      const genre = await genreRepository.findById(genreId);
      if (!genre) {
        throw new Error('Genre not found');
      }
      // Guardar en caché (24 horas)
      await cacheService.set(cacheKey, genre, 86400);
      return genre;
    };

    return await resilienceService.executeWithFallback(
      'getGenreById',
      operation,
      fallback
    );
  }

  async createGenre(genreData) {
    if (!genreData.name) {
      throw new Error('Genre name is required');
    }

    // Verificar que no exista un género con ese nombre
    const existing = await genreRepository.findByName(genreData.name);
    if (existing) {
      throw new Error('Genre already exists');
    }

    const genre = await genreRepository.create(genreData);
    
    // Invalidar caché de géneros
    await cacheService.delPattern('genres:*');
    
    return genre;
  }

  async updateGenre(genreId, genreData) {
    const genre = await genreRepository.update(genreId, genreData);
    if (!genre) {
      throw new Error('Genre not found');
    }
    
    // Invalidar caché del género y listas
    await cacheService.del(`genre:${genreId}`);
    await cacheService.delPattern('genres:*');
    
    return genre;
  }

  async deleteGenre(genreId) {
    const deleted = await genreRepository.delete(genreId);
    if (!deleted) {
      throw new Error('Genre not found');
    }
    
    // Invalidar caché del género y listas
    await cacheService.del(`genre:${genreId}`);
    await cacheService.delPattern('genres:*');
    
    return { message: 'Genre deleted successfully' };
  }
}

module.exports = new GenreService();
