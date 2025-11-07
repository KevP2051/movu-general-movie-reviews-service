const genreService = require('../services/genreService');

class GenreController {
  async getAllGenres(req, res) {
    try {
      const withCount = req.query.withCount === 'true';

      const genres = withCount
        ? await genreService.getAllGenresWithMovieCount()
        : await genreService.getAllGenres();

      res.status(200).json({
        success: true,
        data: genres
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getGenreById(req, res) {
    try {
      const genre = await genreService.getGenreById(req.params.id);

      res.status(200).json({
        success: true,
        data: genre
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async createGenre(req, res) {
    try {
      const genre = await genreService.createGenre(req.body);

      res.status(201).json({
        success: true,
        data: genre
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateGenre(req, res) {
    try {
      const genre = await genreService.updateGenre(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: genre
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteGenre(req, res) {
    try {
      const result = await genreService.deleteGenre(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new GenreController();
