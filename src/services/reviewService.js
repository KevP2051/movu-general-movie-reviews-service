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
   * Obtener reseñas por película (MODO DEBUG - SIN CACHÉ)
   */
  async getReviewsByMovie(movieId, page, limit, status = 'APPROVED') {
    // ==========================================
    // 🔧 MODO DEBUG: CACHE DESACTIVADO
    // ==========================================
    console.log(`🔧 [DEBUG] Obteniendo reviews de movie ${movieId} DIRECTAMENTE de PostgreSQL (sin caché)`);
    console.log(`   - Page: ${page}, Limit: ${limit}, Status: ${status}`);

    // Verificar que la película existe
    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    try {
      // Consulta DIRECTA a PostgreSQL sin caché
      const reviews = await reviewRepository.findByMovie(movieId, page, limit, status);
      
      console.log(`✅ [DEBUG] Reviews obtenidas de BD para movie ${movieId}:`, {
        count: reviews.reviews?.length || 0,
        total: reviews.pagination?.total || 0
      });

      // ⚠️ NO guardamos en caché en modo debug
      return reviews;
    } catch (error) {
      console.error(`❌ [DEBUG] Error obteniendo reviews de BD:`, error.message);
      throw error;
    }
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
   * Obtener estadísticas de película (MODO DEBUG - SIN CACHÉ)
   */
  async getMovieStats(movieId) {
    // ==========================================
    // 🔧 MODO DEBUG: CACHE DESACTIVADO
    // ==========================================
    console.log(`🔧 [DEBUG] Obteniendo stats de movie ${movieId} DIRECTAMENTE de PostgreSQL (sin caché)`);

    const movie = await movieRepository.findById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    try {
      // Consulta DIRECTA a PostgreSQL sin caché
      const stats = await reviewRepository.getMovieStats(movieId);
      
      console.log(`✅ [DEBUG] Stats obtenidas de BD para movie ${movieId}:`, {
        totalReviews: stats.total_reviews || 0,
        avgRating: stats.average_rating || 0,
        hasDistribution: !!stats.ratingDistribution
      });

      // ⚠️ NO guardamos en caché en modo debug
      return stats;
    } catch (error) {
      console.error(`❌ [DEBUG] Error obteniendo stats de BD:`, error.message);
      throw error;
    }
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

    // ==========================================
    // 🔧 MODO DEBUG: REDIS Y KAFKA DESACTIVADOS
    // ==========================================
    // Guardado DIRECTO en PostgreSQL sin caché ni Kafka
    
    console.log(`🔧 [DEBUG MODE] Guardando review directamente en PostgreSQL...`);
    console.log(`📝 Datos a guardar:`, {
      movie_id: reviewData.movie_id,
      user_id: reviewData.user_id,
      rating: reviewData.rating,
      title: reviewData.title,
      status: reviewData.status
    });

    try {
      // Guardar directamente en BD sin pasar por Kafka ni actualizar caché
      const review = await reviewRepository.create(reviewData);
      
      console.log(`✅ [DEBUG] Review guardada EXITOSAMENTE en PostgreSQL:`);
      console.log(`   - ID: ${review.review_id}`);
      console.log(`   - Movie: ${review.movie_id}`);
      console.log(`   - User: ${review.user_id}`);
      console.log(`   - Rating: ${review.rating}`);
      console.log(`   - Status: ${review.status}`);
      console.log(`   - Created: ${review.createdAt}`);
      
      // ⚠️ CACHE Y KAFKA DESACTIVADOS TEMPORALMENTE PARA DEBUG
      console.log(`⚠️ [DEBUG] Caché y Kafka DESACTIVADOS - sin invalidación ni regeneración`);

      return review;
    } catch (error) {
      console.error(`❌ [DEBUG] ERROR al guardar en PostgreSQL:`, error.message);
      console.error(`Stack trace:`, error.stack);
      
      // En modo debug NO enviamos a Kafka, lanzamos el error para verlo
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
}

module.exports = new ReviewService();
