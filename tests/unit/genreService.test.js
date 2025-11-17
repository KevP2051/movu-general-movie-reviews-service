const genreService = require('../../src/services/genreService');

describe('Genre Service', () => {
  test('should return an array of genres', async () => {
    const genres = await genreService.getAllGenres();
    expect(Array.isArray(genres)).toBe(true);
  });

  test('should throw error for invalid genre id', async () => {
    await expect(genreService.getGenreById('invalid')).rejects.toThrow();
  });
});