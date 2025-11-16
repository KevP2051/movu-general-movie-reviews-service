const genreRepository = require('../repositories/genreRepository');
const movieRepository = require('../repositories/movieRepository');
const { getCacheService } = require('./cacheService');

const cacheService = getCacheService();

class CacheWarmingService {
  /**
   * Precalentar todo el caché con géneros, películas y detalles
   */
  async warmAllCache() {
    
    try {
      const startTime = Date.now();
      
      // 1. Cachear géneros
      const genres = await this.warmGenres();
      
      // 2. Cachear películas por género y recolectar IDs
      const movieIds = await this.warmMoviesByGenre(genres);
      
      // 3. Cachear detalles individuales
      await this.warmMovieDetails(movieIds);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('CACHÉ PRECALENTADO EXITOSAMENTE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Géneros: ${genres.length}`);
      console.log(`Películas únicas: ${movieIds.size}`);
      console.log(`Tiempo: ${duration}s\n`);
      
      return true;
    } catch (error) {
      console.error('Error durante precalentamiento de caché:', error.message);
      // No lanzar error para no impedir que el servidor arranque
      return false;
    }
  }

  /**
   * Cachear todos los géneros
   */
  async warmGenres() {
    try {
      const genres = await genreRepository.findAll();
      
      // Cachear lista completa de géneros
      await cacheService.set('genres:all', genres, cacheService.GENRES_TTL);
      
      // Cachear géneros con conteo (si falla, continuar con géneros básicos)
      try {
        const genresWithCount = await genreRepository.findAllWithMovieCount();
        await cacheService.set('genres:with-movie-count', genresWithCount, 3600);
      } catch (countError) {
        console.log('   ⚠️  Skipping genre count cache:', countError.message);
      }
      
      console.log(`   ✅ ${genres.length} géneros cacheados`);
      return genres;
    } catch (error) {
      console.error('   ⚠️  Error cacheando géneros:', error.message);
      return [];
    }
  }

  /**
   * Cachear películas por género y retornar IDs únicos
   */
  async warmMoviesByGenre(genres) {
    const movieIds = new Set();
    let totalMovies = 0;
    
    console.log('   🎬 Cacheando películas por género...');
    
    for (const genre of genres) {
      try {
        // Cachear primera página con límite alto (la mayoría de géneros tienen < 200 películas)
        const result = await movieRepository.findByGenre(genre.id, 1, 200);
        const cacheKey = `movies:genre:${genre.id}:page:1:limit:50`;
        
        // Cachear con el límite que usa el frontend (50)
        const limitedResult = await movieRepository.findByGenre(genre.id, 1, 50);
        await cacheService.cacheMovies(cacheKey, limitedResult);
        
        // Recolectar IDs únicos de todas las películas
        result.movies.forEach(movie => movieIds.add(movie.id));
        totalMovies += result.movies.length;
      } catch (error) {
        console.error(`   ⚠️  Error en género ${genre.name}:`, error.message);
      }
    }
    
    console.log(`   ✅ ${totalMovies} películas cacheadas en ${genres.length} géneros`);
    return movieIds;
  }

  /**
   * Cachear detalles individuales de todas las películas
   */
  async warmMovieDetails(movieIds) {
    const movieIdsArray = Array.from(movieIds);
    let cached = 0;
    
    console.log(`   🎯 Cacheando ${movieIdsArray.length} detalles de películas...`);
    
    for (let i = 0; i < movieIdsArray.length; i++) {
      const movieId = movieIdsArray[i];
      
      try {
        const movie = await movieRepository.findById(movieId);
        if (movie) {
          await cacheService.cacheMovieDetails(movieId, movie);
          cached++;
        }
        
        // Mostrar progreso cada 25 películas
        if ((i + 1) % 25 === 0 || (i + 1) === movieIdsArray.length) {
          const percentage = (((i + 1) / movieIdsArray.length) * 100).toFixed(0);
          process.stdout.write(`\r   ⏳ Progreso: ${i + 1}/${movieIdsArray.length} (${percentage}%)...`);
        }
      } catch (error) {
        // Silenciosamente continuar con la siguiente película
      }
    }
    
    console.log(`\n   ✅ ${cached} detalles cacheados`);
    return cached;
  }

  /**
   * Verificar si el caché ya está poblado
   */
  async isCacheWarmed() {
    try {
      // Verificar si existen géneros y algunas películas cacheadas
      const genresExist = await cacheService.exists('genres:all');
      const someMoviesExist = await cacheService.exists('movie:1'); // Verificar si al menos una película existe
      
      return genresExist && someMoviesExist;
    } catch (error) {
      return false;
    }
  }
}

// Singleton
let cacheWarmingServiceInstance = null;

module.exports = {
  getCacheWarmingService: () => {
    if (!cacheWarmingServiceInstance) {
      cacheWarmingServiceInstance = new CacheWarmingService();
    }
    return cacheWarmingServiceInstance;
  },
  CacheWarmingService
};
