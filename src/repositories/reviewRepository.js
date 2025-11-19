const { Review, Movie } = require('../models');
const { Op } = require('sequelize');

class ReviewRepository {
  /**
   * Obtener todas las reseñas con paginación
   */
  async findAll(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.hasSpoiler !== undefined) where.hasSpoiler = filters.hasSpoiler;

    const { count, rows } = await Review.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: Movie,
          as: 'movie',
          attributes: ['movie_id', 'original_title', 'poster_url']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return {
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar reseña por ID
   */
  async findById(reviewId) {
    return await Review.findByPk(reviewId, {
      include: [
        {
          model: Movie,
          as: 'movie',
          attributes: ['movie_id', 'original_title', 'director', 'poster_url']
        }
      ]
    });
  }

  /**
   * Obtener reseñas de una película
   */
  async findByMovie(movieId, page = 1, limit = 20, status = 'APPROVED') {
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: {
        movie_id: movieId,
        status
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Obtener reseñas de un usuario
   */
  async findByUser(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      include: [
        {
          model: Movie,
          as: 'movie',
          attributes: ['movie_id', 'original_title', 'poster_url']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return {
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar reseñas por calificación
   */
  async findByRating(minRating, maxRating, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: {
        rating: {
          [Op.between]: [minRating, maxRating]
        },
        status: 'APPROVED'
      },
      limit,
      offset,
      include: [
        {
          model: Movie,
          as: 'movie',
          attributes: ['movie_id', 'original_title', 'poster_url']
        }
      ],
      order: [['rating', 'DESC']]
    });

    return {
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Obtener estadísticas de reseñas de una película
   */
  async getMovieStats(movieId) {
    // Obtener estadísticas generales
    const stats = await Review.findAll({
      where: {
        movie_id: movieId,
        status: 'APPROVED'
      },
      attributes: [
        [Review.sequelize.fn('COUNT', Review.sequelize.col('review_id')), 'total_reviews'],
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average_rating'],
        [Review.sequelize.fn('MAX', Review.sequelize.col('rating')), 'max_rating'],
        [Review.sequelize.fn('MIN', Review.sequelize.col('rating')), 'min_rating']
      ],
      raw: true
    });

    // Obtener distribución de ratings (contar cuántas reviews de cada rating)
    const distribution = await Review.findAll({
      where: {
        movie_id: movieId,
        status: 'APPROVED'
      },
      attributes: [
        'rating',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('rating')), 'count']
      ],
      group: ['rating'],
      raw: true
    });

    // Convertir array de distribución a objeto { rating: count }
    const ratingDistribution = {};
    distribution.forEach(item => {
      ratingDistribution[item.rating] = parseInt(item.count);
    });

    return {
      ...stats[0],
      ratingDistribution
    };
  }

  /**
   * Buscar reseña existente de un usuario para una película
   */
  async findByUserAndMovie(userId, movieId) {
    return await Review.findOne({
      where: {
        user_id: userId,
        movie_id: movieId
      }
    });
  }

  /**
   * Crear nueva reseña
   */
  async create(reviewData) {
    return await Review.create(reviewData);
  }

  /**
   * Actualizar reseña
   */
  async update(reviewId, reviewData) {
    const review = await Review.findByPk(reviewId);
    if (!review) return null;
    
    await review.update(reviewData);
    return review;
  }

  /**
   * Eliminar reseña
   */
  async delete(reviewId) {
    const review = await Review.findByPk(reviewId);
    if (!review) return false;
    
    await review.destroy();
    return true;
  }

  /**
   * Cambiar estado de una reseña (aprobar/rechazar)
   */
  async updateStatus(reviewId, status) {
    const review = await Review.findByPk(reviewId);
    if (!review) return null;

    await review.update({ status });
    return review;
  }
}

module.exports = new ReviewRepository();
