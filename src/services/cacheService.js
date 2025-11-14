const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    this.redis.on('connect', () => {
      console.log('✓ Redis connected successfully');
    });

    // TTL por defecto (en segundos)
    this.DEFAULT_TTL = 3600; // 1 hora
    this.POPULAR_MOVIES_TTL = 1800; // 30 minutos
    this.MOVIE_DETAILS_TTL = 7200; // 2 horas
    this.GENRES_TTL = 86400; // 24 horas
  }

  /**
   * Obtener un valor del caché
   */
  async get(key) {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Guardar un valor en el caché
   */
  async set(key, value, ttl = this.DEFAULT_TTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Eliminar un valor del caché
   */
  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Eliminar múltiples valores que coincidan con un patrón
   */
  async delPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting cache pattern ${pattern}:`, error.message);
      return false;
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key) {
    try {
      return await this.redis.exists(key) === 1;
    } catch (error) {
      console.error(`Error checking cache existence for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Verificar si Redis está disponible
   */
  async isAvailable() {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // ========== MÉTODOS ESPECÍFICOS PARA PELÍCULAS ==========

  /**
   * Cachear lista de películas
   */
  async cacheMovies(cacheKey, movies, ttl = this.DEFAULT_TTL) {
    return await this.set(cacheKey, movies, ttl);
  }

  /**
   * Obtener películas del caché
   */
  async getMovies(cacheKey) {
    return await this.get(cacheKey);
  }

  /**
   * Cachear detalles de una película
   */
  async cacheMovieDetails(movieId, movieData) {
    const key = `movie:${movieId}`;
    return await this.set(key, movieData, this.MOVIE_DETAILS_TTL);
  }

  /**
   * Obtener detalles de una película del caché
   */
  async getMovieDetails(movieId) {
    const key = `movie:${movieId}`;
    return await this.get(key);
  }

  /**
   * Invalidar caché de una película
   */
  async invalidateMovie(movieId) {
    const key = `movie:${movieId}`;
    await this.del(key);
    // También invalidar listas que puedan contener esta película
    await this.delPattern('movies:*');
  }

  // ========== MÉTODOS ESPECÍFICOS PARA GÉNEROS ==========

  /**
   * Cachear géneros
   */
  async cacheGenres(genres) {
    const key = 'genres:all';
    return await this.set(key, genres, this.GENRES_TTL);
  }

  /**
   * Obtener géneros del caché
   */
  async getGenres() {
    const key = 'genres:all';
    return await this.get(key);
  }

  /**
   * Invalidar caché de géneros
   */
  async invalidateGenres() {
    await this.delPattern('genres:*');
  }

  // ========== MÉTODOS ESPECÍFICOS PARA RESEÑAS ==========

  /**
   * Cachear estadísticas de reseñas de una película
   */
  async cacheMovieStats(movieId, stats) {
    const key = `movie:${movieId}:stats`;
    return await this.set(key, stats, 600); // 10 minutos (datos más dinámicos)
  }

  /**
   * Obtener estadísticas de reseñas del caché
   */
  async getMovieStats(movieId) {
    const key = `movie:${movieId}:stats`;
    return await this.get(key);
  }

  /**
   * Invalidar estadísticas de una película
   */
  async invalidateMovieStats(movieId) {
    const key = `movie:${movieId}:stats`;
    await this.del(key);
  }

  // ========== MÉTODOS PARA BÚSQUEDAS ==========

  /**
   * Cachear resultados de búsqueda
   */
  async cacheSearchResults(query, results) {
    const key = `search:${query.toLowerCase()}`;
    return await this.set(key, results, 1800); // 30 minutos
  }

  /**
   * Obtener resultados de búsqueda del caché
   */
  async getSearchResults(query) {
    const key = `search:${query.toLowerCase()}`;
    return await this.get(key);
  }

  /**
   * Cerrar conexión Redis
   */
  async disconnect() {
    await this.redis.quit();
  }
}

// Singleton
let cacheServiceInstance = null;

module.exports = {
  getCacheService: () => {
    if (!cacheServiceInstance) {
      cacheServiceInstance = new CacheService();
    }
    return cacheServiceInstance;
  },
  CacheService
};
