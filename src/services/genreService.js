const genreRepository = require('../repositories/genreRepository');

class GenreService {
  async getAllGenres() {
    return await genreRepository.findAll();
  }

  async getAllGenresWithMovieCount() {
    return await genreRepository.findAllWithMovieCount();
  }

  async getGenreById(genreId) {
    const genre = await genreRepository.findById(genreId);
    if (!genre) {
      throw new Error('Genre not found');
    }
    return genre;
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

    return await genreRepository.create(genreData);
  }

  async updateGenre(genreId, genreData) {
    const genre = await genreRepository.update(genreId, genreData);
    if (!genre) {
      throw new Error('Genre not found');
    }
    return genre;
  }

  async deleteGenre(genreId) {
    const deleted = await genreRepository.delete(genreId);
    if (!deleted) {
      throw new Error('Genre not found');
    }
    return { message: 'Genre deleted successfully' };
  }
}

module.exports = new GenreService();
