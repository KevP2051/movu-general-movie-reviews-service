const reviewService = require('../services/reviewService');

class ReviewController {
  async getAllReviews(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        status: req.query.status,
        hasSpoiler: req.query.hasSpoiler
      };

      const result = await reviewService.getAllReviews(page, limit, filters);

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getReviewById(req, res) {
    try {
      const review = await reviewService.getReviewById(req.params.id);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async getReviewsByMovie(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status || 'APPROVED';

      const result = await reviewService.getReviewsByMovie(
        req.params.movieId,
        page,
        limit,
        status
      );

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async getReviewsByUser(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await reviewService.getReviewsByUser(
        req.params.userId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getReviewsByRating(req, res) {
    try {
      const minRating = parseInt(req.query.min) || 1;
      const maxRating = parseInt(req.query.max) || 10;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await reviewService.getReviewsByRating(
        minRating,
        maxRating,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getMovieStats(req, res) {
    try {
      const stats = await reviewService.getMovieStats(req.params.movieId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async createReview(req, res) {
    try {
      // El user_id viene del gateway en req.user (ya autenticado)
      const reviewData = {
        ...req.body,
        user_id: req.user.id // Usamos el ID del usuario autenticado por el gateway
      };
      
      const review = await reviewService.createReview(reviewData);

      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateReview(req, res) {
    try {
      // El userId viene del gateway en req.user (ya autenticado)
      const userId = req.user.id;

      const review = await reviewService.updateReview(
        req.params.id,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      const status = error.message.includes('Unauthorized') ? 403 : 404;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteReview(req, res) {
    try {
      // El userId y role vienen del gateway en req.user (ya autenticado)
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const result = await reviewService.deleteReview(
        req.params.id,
        userId,
        isAdmin
      );

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const status = error.message.includes('Unauthorized') ? 403 : 404;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async approveReview(req, res) {
    try {
      const review = await reviewService.approveReview(req.params.id);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async rejectReview(req, res) {
    try {
      const review = await reviewService.rejectReview(req.params.id);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ReviewController();
