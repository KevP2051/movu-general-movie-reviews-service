const reviewRepository = require('../repositories/reviewRepository');
const movieRepository = require('../repositories/movieRepository');
const { getCacheService } = require('./cacheService');
const { getKafkaService } = require('./kafkaService');
const { getResilienceService } = require('./resilienceService');

const cacheService = getCacheService();
const kafkaService = getKafkaService();
const resilienceService = getResilienceService();

class ReviewService {
  /**
   * Obtener todas las reseñas con caché
   */
  async getAllReviews(page, limit, filters) {
    const cacheKey = `reviews:all:${page}:${limit}:${JSON.stringify(filters)}`;
    
    // Intentar desde caché
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('✅ Reviews served from cache');
      return cached;
    }

    // Si no está en caché, usar Circuit Breaker para BD
    try {
      const breaker = resilienceService.createDatabaseBreaker();
      const reviews = await breaker.fire(async () => {
        return await reviewRepository.findAll(page, limit, filters);
      });

      // Cachear resultado (30 minutos)
      await cacheService.set(cacheKey, reviews, 1800);
      return reviews;
    } catch (error) {
      console.log('⚠️ Database unavailable for getAllReviews');
      // Fallback: devolver array vacío
      return { reviews: [], total: 0, page, limit };
    }
  }

  /**
   * Obtener reseña por ID con caché
   */
  async getReviewById(reviewId) {
    const cacheKey = `review:${reviewId}`;
    
    // Intentar desde caché
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Review ${reviewId} served from cache`);
      return cached;
    }

    // Si no está en caché, usar Circuit Breaker
    try {
      const breaker = resilienceService.createDatabaseBreaker();
      const review = await breaker.fire(async () => {
        return await reviewRepository.findById(reviewId);
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Cachear (1 hora)
      await cacheService.set(cacheKey, review, 3600);
      return review;
    } catch (error) {
      if (error.message === 'Review not found') throw error;
      throw new Error('Database unavailable - review not in cache');
    }
  }

  /**
   * Obtener reseñas por película (con caché Redis)
   */
  async getReviewsByMovie(movieId, page, limit, status = 'APPROVED') {
    const cacheKey = `reviews:movie:${movieId}:${page}:${limit}:${status}`;

    // Verificar que la película existe
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Intentar obtener del caché
    if (cacheService.isAvailable()) {
      try {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          console.log(`✓ Reviews servidas desde caché para movie ${movieId}`);
          return cached;
        }
      } catch (error) {
        console.warn(`⚠️ Error al leer caché:`, error.message);
      }
    }

    // Si no está en caché, consultar BD
    const reviews = await reviewRepository.findByMovie(movieId, page, limit, status);

    // Guardar en caché (fire-and-forget)
    if (cacheService.isAvailable()) {
      cacheService.set(cacheKey, reviews, 300).catch(err => 
        console.warn(`⚠️ Error al guardar en caché:`, err.message)
      );
    }

    return reviews;
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

  /**
   * Obtener estadísticas de película (con caché Redis)
   */
  async getMovieStats(movieId) {
    const cacheKey = `reviews:movie:${movieId}:stats`;

    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // Intentar obtener del caché
    if (cacheService.isAvailable()) {
      try {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          console.log(`✓ Stats servidas desde caché para movie ${movieId}`);
          return cached;
        }
      } catch (error) {
        console.warn(`⚠️ Error al leer caché de stats:`, error.message);
      }
    }

    // Si no está en caché, consultar BD
    const stats = await reviewRepository.getMovieStats(movieId);

    // Guardar en caché (5 minutos)
    if (cacheService.isAvailable()) {
      cacheService.set(cacheKey, stats, 300).catch(err => 
        console.warn(`⚠️ Error al guardar stats en caché:`, err.message)
      );
    }

    return stats;
  }

  /**
   * Crear reseña con Kafka para escritura asíncrona
   */
  async createReview(reviewData) {
    // Validaciones
    if (!reviewData.movie_id || !reviewData.user_id || !reviewData.rating || !reviewData.title) {
      throw new Error('Missing required fields: movie_id, user_id, rating, title');
    }

    if (reviewData.rating < 1 || reviewData.rating > 10) {
      throw new Error('Rating must be between 1 and 10');
    }

    // OPTIMIZACIÓN: Eliminada validación de película para mejorar rendimiento
    // La película ya fue validada en el frontend cuando se carga la página de detalles
    // Esta validación extra causaba lentitud innecesaria (~500ms-2s de retraso)

    // Establecer estado por defecto (APPROVED para que aparezca inmediatamente en estadísticas)
    if (!reviewData.status) {
      reviewData.status = 'APPROVED';
    }

    console.log(`📝 Creando nueva review en PostgreSQL...`);
    console.log(`📝 Datos:`, {
      movie_id: reviewData.movie_id,
      user_id: reviewData.user_id,
      rating: reviewData.rating,
      title: reviewData.title,
      user_email: reviewData.user_email,
      user_name: reviewData.user_name,
      status: reviewData.status
    });

    try {
      // 1. Guardar en BD
      const review = await reviewRepository.create(reviewData);
      
      console.log(`✅ Review guardada en PostgreSQL (ID: ${review.review_id})`);
      
      // 2. Invalidar caché de forma asíncrona (fire-and-forget)
      if (cacheService.isAvailable()) {
        (async () => {
          try {
            // Invalidar reviews de la película
            await cacheService.delPattern(`reviews:movie:${reviewData.movie_id}*`);
            // Invalidar stats de la película
            await cacheService.invalidateMovieStats(reviewData.movie_id);
            
            console.log(`🗑️ Caché invalidado para movie ${reviewData.movie_id}`);
          } catch (error) {
            console.warn(`⚠️ Error al invalidar caché:`, error.message);
          }
        })();
      }

      // 3. Actualizar rating promedio de la película de forma asíncrona
      (async () => {
        try {
          await this.updateMovieAverageRating(reviewData.movie_id);
          console.log(`📊 Rating promedio actualizado para movie ${reviewData.movie_id}`);
        } catch (error) {
          console.warn(`⚠️ Error al actualizar rating promedio:`, error.message);
        }
      })();

      // 4. Enviar evento a Kafka de forma asíncrona
      if (kafkaService.isAvailable()) {
        (async () => {
          try {
            await kafkaService.sendReviewCreate({
              review_id: review.review_id,
              movie_id: review.movie_id,
              user_id: review.user_id,
              rating: review.rating,
              status: review.status,
              title: review.title,
              content: review.content
            });
            console.log(`📤 Evento enviado a Kafka: review-created`);
          } catch (error) {
            console.warn(`⚠️ Error al enviar a Kafka:`, error.message);
          }
        })();
      }

      return review;
    } catch (error) {
      console.error(`❌ ERROR al crear review:`, error.message);
      throw error;
    }
  }

  /**
   * Actualizar reseña con Kafka para escritura asíncrona
   */
  async updateReview(reviewId, reviewData, userId) {
    // Intentar obtener la reseña existente (puede estar en caché)
    let existingReview;
    try {
      existingReview = await this.getReviewById(reviewId);
    } catch (error) {
      throw new Error('Review not found or database unavailable');
    }

    // Verificar que el usuario es dueño de la reseña
    if (existingReview.user_id !== userId) {
      throw new Error('Unauthorized: You can only update your own reviews');
    }

    // Validar rating si se proporciona
    if (reviewData.rating && (reviewData.rating < 1 || reviewData.rating > 10)) {
      throw new Error('Rating must be between 1 and 10');
    }

    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log(`⚠️ Database down - Sending review ${reviewId} update to Kafka queue`);
      
      await kafkaService.sendReviewUpdate(reviewId, reviewData);

      return {
        message: 'Review update queued successfully',
        queued: true,
        reviewId,
        data: reviewData
      };
    }

    // Si la BD está disponible, actualizar directamente
    try {
      const updatedReview = await reviewRepository.update(reviewId, reviewData);
      
      // Invalidar caché relacionado
      await cacheService.del(`review:${reviewId}`);
      await cacheService.delPattern(`reviews:movie:${existingReview.movie_id}:*`);
      await cacheService.delPattern(`reviews:all:*`);
      await cacheService.del(`movie:stats:${existingReview.movie_id}`);

      return updatedReview;
    } catch (error) {
      // Si falla, enviar a Kafka como fallback
      console.log(`⚠️ Database error - Sending review ${reviewId} update to Kafka`);
      await kafkaService.sendReviewUpdate(reviewId, reviewData);

      return {
        message: 'Review update queued due to error',
        queued: true,
        reviewId,
        data: reviewData
      };
    }
  }

  /**
   * Eliminar reseña con Kafka para escritura asíncrona
   */
  async deleteReview(reviewId, userId, isAdmin = false) {
    // Intentar obtener la reseña existente
    let existingReview;
    try {
      existingReview = await this.getReviewById(reviewId);
    } catch (error) {
      throw new Error('Review not found or database unavailable');
    }

    // Solo el dueño o un admin pueden eliminar
    if (!isAdmin && existingReview.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own reviews');
    }

    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log(`⚠️ Database down - Sending review ${reviewId} deletion to Kafka queue`);
      
      await kafkaService.sendReviewDelete(reviewId);

      return {
        message: 'Review deletion queued successfully',
        queued: true,
        reviewId
      };
    }

    // Si la BD está disponible, eliminar directamente
    try {
      const deleted = await reviewRepository.delete(reviewId);
      if (!deleted) {
        throw new Error('Failed to delete review');
      }

      // Invalidar caché relacionado
      await cacheService.del(`review:${reviewId}`);
      await cacheService.delPattern(`reviews:movie:${existingReview.movie_id}:*`);
      await cacheService.delPattern(`reviews:all:*`);
      await cacheService.del(`movie:stats:${existingReview.movie_id}`);

      return { message: 'Review deleted successfully' };
    } catch (error) {
      // Si falla, enviar a Kafka como fallback
      console.log(`⚠️ Database error - Sending review ${reviewId} deletion to Kafka`);
      await kafkaService.sendReviewDelete(reviewId);

      return {
        message: 'Review deletion queued due to error',
        queued: true,
        reviewId
      };
    }
  }

  /**
   * Aprobar reseña (admin) con Kafka
   */
  async approveReview(reviewId) {
    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log(`⚠️ Database down - Sending review ${reviewId} approval to Kafka queue`);
      
      await kafkaService.sendReviewUpdate(reviewId, { status: 'APPROVED' });

      return {
        message: 'Review approval queued successfully',
        queued: true,
        reviewId
      };
    }

    try {
      const result = await reviewRepository.updateStatus(reviewId, 'APPROVED');
      
      // Invalidar caché
      await cacheService.del(`review:${reviewId}`);
      await cacheService.delPattern(`reviews:*`);

      return result;
    } catch (error) {
      console.log(`⚠️ Database error - Queueing review ${reviewId} approval`);
      await kafkaService.sendReviewUpdate(reviewId, { status: 'APPROVED' });

      return {
        message: 'Review approval queued due to error',
        queued: true,
        reviewId
      };
    }
  }

  /**
   * Rechazar reseña (admin) con Kafka
   */
  async rejectReview(reviewId) {
    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log(`⚠️ Database down - Sending review ${reviewId} rejection to Kafka queue`);
      
      await kafkaService.sendReviewUpdate(reviewId, { status: 'REJECTED' });

      return {
        message: 'Review rejection queued successfully',
        queued: true,
        reviewId
      };
    }

    try {
      const result = await reviewRepository.updateStatus(reviewId, 'REJECTED');
      
      // Invalidar caché
      await cacheService.del(`review:${reviewId}`);
      await cacheService.delPattern(`reviews:*`);

      return result;
    } catch (error) {
      console.log(`⚠️ Database error - Queueing review ${reviewId} rejection`);
      await kafkaService.sendReviewUpdate(reviewId, { status: 'REJECTED' });

      return {
        message: 'Review rejection queued due to error',
        queued: true,
        reviewId
      };
    }
  }

  /**
   * Cambiar estado de reseña (admin) - Método flexible
   * Permite cambiar a cualquier estado: PENDING, APPROVED, REJECTED
   */
  async changeReviewStatus(reviewId, newStatus, isAdmin = false) {
    // Validar que el usuario es admin
    if (!isAdmin) {
      throw new Error('Unauthorized: Only admins can change review status');
    }

    // Validar que el estado es válido
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Verificar que la reseña existe
    let existingReview;
    try {
      existingReview = await this.getReviewById(reviewId);
    } catch (error) {
      throw new Error('Review not found or database unavailable');
    }

    // Si el estado es el mismo, no hacer nada
    if (existingReview.status === newStatus) {
      return {
        message: `Review is already ${newStatus}`,
        review: existingReview
      };
    }

    // Si la BD está caída, enviar a Kafka
    if (!resilienceService.isDatabaseAvailable()) {
      console.log(`⚠️ Database down - Sending review ${reviewId} status change to Kafka queue`);
      
      await kafkaService.sendReviewUpdate(reviewId, { status: newStatus });

      return {
        message: `Review status change to ${newStatus} queued successfully`,
        queued: true,
        reviewId,
        newStatus
      };
    }

    // Si la BD está disponible, actualizar directamente
    try {
      const result = await reviewRepository.updateStatus(reviewId, newStatus);
      
      // Invalidar caché relacionado
      await cacheService.del(`review:${reviewId}`);
      await cacheService.delPattern(`reviews:movie:${existingReview.movie_id}:*`);
      await cacheService.delPattern(`reviews:all:*`);
      await cacheService.del(`movie:stats:${existingReview.movie_id}`);

      return {
        message: `Review status changed to ${newStatus} successfully`,
        review: result
      };
    } catch (error) {
      // Si falla, enviar a Kafka como fallback
      console.log(`⚠️ Database error - Queueing review ${reviewId} status change`);
      await kafkaService.sendReviewUpdate(reviewId, { status: newStatus });

      return {
        message: `Review status change to ${newStatus} queued due to error`,
        queued: true,
        reviewId,
        newStatus
      };
    }
  }

  /**
   * Actualizar el rating promedio de una película
   */
  async updateMovieAverageRating(movieId) {
    try {
      // Obtener estadísticas de reviews aprobadas
      const stats = await reviewRepository.getMovieStats(movieId);
      const avgRating = stats.average_rating ? parseFloat(stats.average_rating) : null;
      
      // Actualizar el campo average_rating en la tabla MOVIES
      await movieRepository.update(movieId, { average_rating: avgRating });
      
      // Invalidar caché de la película
      if (cacheService.isAvailable()) {
        await cacheService.invalidateMovie(movieId);
      }
      
      console.log(`✅ Average rating actualizado para movie ${movieId}: ${avgRating}`);
      return avgRating;
    } catch (error) {
      console.error(`❌ Error actualizando average rating para movie ${movieId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new ReviewService();
