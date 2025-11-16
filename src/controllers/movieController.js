const movieService = require('../services/movieService');

class MovieController {
  async getAllMovies(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await movieService.getAllMovies(page, limit);

      res.status(200).json({
        success: true,
        data: result.movies,
        pagination: result.pagination,
        fromCache: result.fromCache,
        degradedMode: result.degradedMode
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMovieById(req, res) {
    try {
      const movie = await movieService.getMovieById(req.params.id);

      res.status(200).json({
        success: true,
        data: movie
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMoviesByGenre(req, res) {
    try {
      const { genreId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await movieService.getMoviesByGenre(genreId, page, limit);

      res.status(200).json({
        success: true,
        data: result.movies,
        pagination: result.pagination,
        fromCache: result.fromCache,
        degradedMode: result.degradedMode
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async searchMovies(req, res) {
    try {
      const query = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await movieService.searchMovies(query, page, limit);

      res.status(200).json({
        success: true,
        data: result.movies,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMoviesByDirector(req, res) {
    try {
      const director = req.query.director;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await movieService.getMoviesByDirector(director, page, limit);

      res.status(200).json({
        success: true,
        data: result.movies,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMoviesByYear(req, res) {
    try {
      const year = parseInt(req.params.year);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await movieService.getMoviesByYear(year, page, limit);

      res.status(200).json({
        success: true,
        data: result.movies,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async createMovie(req, res) {
    try {
      const movie = await movieService.createMovie(req.body);

      res.status(201).json({
        success: true,
        data: movie
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateMovie(req, res) {
    try {
      const movie = await movieService.updateMovie(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: movie
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteMovie(req, res) {
    try {
      const result = await movieService.deleteMovie(req.params.id);

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

module.exports = new MovieController();
