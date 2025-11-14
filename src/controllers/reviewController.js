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
      // En producción, user_id vendría del token JWT
      // Por ahora lo tomamos del body
      const review = await reviewService.createReview(req.body);

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
      // En producción, userId vendría del token JWT
      const userId = req.body.user_id || req.user?.id;

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
      // En producción, userId y isAdmin vendrían del token JWT
      const userId = req.body.user_id || req.user?.id;
      const isAdmin = req.user?.isAdmin || false;

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

  async changeReviewStatus(req, res) {
    try {
      // En producción, isAdmin vendría del token JWT
      const isAdmin = req.user?.isAdmin || req.body.isAdmin || false;
      const newStatus = req.body.status;

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          error: 'Status is required. Valid values: PENDING, APPROVED, REJECTED'
        });
      }

      const result = await reviewService.changeReviewStatus(
        req.params.id,
        newStatus,
        isAdmin
      );

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      const status = error.message.includes('Unauthorized') ? 403 : 
                     error.message.includes('not found') ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ReviewController();
