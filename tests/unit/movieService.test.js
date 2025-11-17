const movieService = require('../../src/services/movieService');

describe('Movie Service', () => {
  test('should return an object with movies array', async () => {
    const result = await movieService.getAllMovies(1, 10);
    expect(Array.isArray(result.movies)).toBe(true);
  });

  test('should throw error for invalid movie id', async () => {
    await expect(movieService.getMovieById('invalid')).rejects.toThrow();
  });
});

// Cierra la conexión de Redis después de todos los tests
afterAll(async () => {
  const cacheService = require('../../src/services/cacheService').getCacheService();
  if (cacheService.redis && cacheService.redis.quit) {
    await cacheService.redis.quit();
  }
});