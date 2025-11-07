const reviewRepository = require('../repositories/reviewRepository');
const movieRepository = require('../repositories/movieRepository');

class ReviewService {
  async getAllReviews(page, limit, filters) {
    return await reviewRepository.findAll(page, limit, filters);
  }

  async getReviewById(reviewId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    return review;
  }

  async getReviewsByMovie(movieId, page, limit, status = 'APPROVED') {
    // Verificar que la película existe
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    return await reviewRepository.findByMovie(movieId, page, limit, status);
  }

  async getReviewsByUser(userId, page, limit) {
    return await reviewRepository.findByUser(userId, page, limit);
  }

  async getReviewsByRating(minRating, maxRating, page, limit) {
    if (minRating < 1 || maxRating > 10 || minRating > maxRating) {
      throw new Error('Invalid rating range. Must be between 1 and 10');
    }
    return await reviewRepository.findByRating(minRating, maxRating, page, limit);
  }

  async getMovieStats(movieId) {
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    return await reviewRepository.getMovieStats(movieId);
  }

  async createReview(reviewData) {
    // Validaciones
    if (!reviewData.movie_id || !reviewData.user_id || !reviewData.rating || !reviewData.title) {
      throw new Error('Missing required fields: movie_id, user_id, rating, title');
    }

    if (reviewData.rating < 1 || reviewData.rating > 10) {
      throw new Error('Rating must be between 1 and 10');
    }

    // Verificar que la película existe
    const movie = await movieRepository.findById(reviewData.movie_id);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Establecer estado por defecto
    if (!reviewData.status) {
      reviewData.status = 'PENDING';
    }

    return await reviewRepository.create(reviewData);
  }

  async updateReview(reviewId, reviewData, userId) {
    const existingReview = await reviewRepository.findById(reviewId);
    if (!existingReview) {
      throw new Error('Review not found');
    }

    // Verificar que el usuario es dueño de la reseña
    if (existingReview.user_id !== userId) {
      throw new Error('Unauthorized: You can only update your own reviews');
    }

    // Validar rating si se proporciona
    if (reviewData.rating && (reviewData.rating < 1 || reviewData.rating > 10)) {
      throw new Error('Rating must be between 1 and 10');
    }

    return await reviewRepository.update(reviewId, reviewData);
  }

  async deleteReview(reviewId, userId, isAdmin = false) {
    const existingReview = await reviewRepository.findById(reviewId);
    if (!existingReview) {
      throw new Error('Review not found');
    }

    // Solo el dueño o un admin pueden eliminar
    if (!isAdmin && existingReview.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own reviews');
    }

    const deleted = await reviewRepository.delete(reviewId);
    if (!deleted) {
      throw new Error('Failed to delete review');
    }

    return { message: 'Review deleted successfully' };
  }

  async approveReview(reviewId) {
    return await reviewRepository.updateStatus(reviewId, 'APPROVED');
  }

  async rejectReview(reviewId) {
    return await reviewRepository.updateStatus(reviewId, 'REJECTED');
  }
}

module.exports = new ReviewService();
