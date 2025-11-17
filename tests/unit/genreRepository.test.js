const genreRepository = require('../../src/repositories/genreRepository');

describe('Genre Repository', () => {
  test('should return an array of genres from repository', async () => {
    const genres = await genreRepository.findAll();
    expect(Array.isArray(genres)).toBe(true);
  });
});