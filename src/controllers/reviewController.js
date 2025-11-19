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

      // Deshabilitar caché del navegador para reviews (contenido dinámico)
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

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
      const movieId = req.params.movieId;
      console.log(`📊 Solicitando estadísticas para movie ${movieId}`);
      
      const stats = await reviewService.getMovieStats(movieId);
      
      console.log(`✓ Estadísticas obtenidas para movie ${movieId}:`, {
        totalReviews: stats.total_reviews || stats.totalReviews || 0,
        avgRating: stats.average_rating || stats.averageRating || 0
      });

      // Deshabilitar caché del navegador para estadísticas (datos dinámicos)
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error(`❌ Error obteniendo estadísticas para movie ${req.params.movieId}:`, error.message);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async createReview(req, res) {
    console.log('🎯 [Controller] POST /api/reviews recibido');
    console.log('📦 [Controller] Body:', JSON.stringify(req.body));
    console.log('🔑 [Controller] Headers:', {
      'x-user-id': req.headers['x-user-id'],
      'x-user-email': req.headers['x-user-email'],
      'x-user-name': req.headers['x-user-name'],
      'x-user-role': req.headers['x-user-role'],
      'content-type': req.headers['content-type']
    });
    
    try {
      // Agregar información del usuario desde los headers del Gateway
      const reviewData = {
        ...req.body,
        user_email: req.headers['x-user-email'] || null,
        user_name: req.headers['x-user-name'] || null,
        userRole: req.headers['x-user-role'] || 'user'
      };
      
      console.log('👤 [Controller] Datos de usuario agregados:', {
        user_email: reviewData.user_email,
        user_name: reviewData.user_name
      });
      
      const review = await reviewService.createReview(reviewData);

      console.log(`📝 Review creation completed - returning response to client`);
      
      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      console.error(`❌ Error creating review:`, error.message);
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
