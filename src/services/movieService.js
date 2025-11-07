const movieRepository = require('../repositories/movieRepository');

class MovieService {
  async getAllMovies(page, limit) {
    return await movieRepository.findAll(page, limit);
  }

  async getMovieById(movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }
    return movie;
  }

  async getMoviesByGenre(genreId, page, limit) {
    return await movieRepository.findByGenre(genreId, page, limit);
  }

  async searchMovies(query, page, limit) {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }
    return await movieRepository.searchByTitle(query, page, limit);
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

  async createMovie(movieData) {
    // Validaciones básicas
    if (!movieData.original_title || !movieData.director || !movieData.release_date) {
      throw new Error('Missing required fields: original_title, director, release_date');
    }

    const movie = await movieRepository.create(movieData);

    // Asociar géneros si se proporcionan
    if (movieData.genre_ids && movieData.genre_ids.length > 0) {
      await movieRepository.associateGenres(movie.movie_id, movieData.genre_ids);
    }

    return await movieRepository.findById(movie.movie_id);
  }

  async updateMovie(movieId, movieData) {
    const movie = await movieRepository.update(movieId, movieData);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Actualizar géneros si se proporcionan
    if (movieData.genre_ids) {
      await movieRepository.associateGenres(movieId, movieData.genre_ids);
    }

    return await movieRepository.findById(movieId);
  }

  async deleteMovie(movieId) {
    const deleted = await movieRepository.delete(movieId);
    if (!deleted) {
      throw new Error('Movie not found');
    }
    return { message: 'Movie deleted successfully' };
  }
}

module.exports = new MovieService();
