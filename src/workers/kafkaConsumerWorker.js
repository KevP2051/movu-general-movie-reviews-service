const { getKafkaService } = require('../services/kafkaService');
const reviewRepository = require('../repositories/reviewRepository');
const movieRepository = require('../repositories/movieRepository');
const { getCacheService } = require('../services/cacheService');

const kafkaService = getKafkaService();
const cacheService = getCacheService();

/**
 * Worker para procesar mensajes de Kafka y escribir a BD cuando se recupera
 */
class KafkaConsumerWorker {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Procesar eventos de reseñas
   */
  async processReviewMessage(message) {
    const { action, data, reviewId } = message;

    try {
      switch (action) {
        case 'CREATE':
          // La review ya fue creada sincrónicamente en el endpoint
          // Este evento es solo para procesamiento adicional (analytics, notificaciones, etc.)
          console.log(`✓ Review CREATE event processed: movie_id=${data.movie_id}, review_id=${data.review_id}`);
          
          // Aquí podrías agregar:
          // - Enviar notificaciones
          // - Actualizar métricas de analytics
          // - Sincronizar con otros servicios
          // El caché ya fue invalidado en el servicio principal
          break;

        case 'UPDATE':
          console.log(`📝 Processing queued review update: ${reviewId}...`);
          await reviewRepository.update(reviewId, data);
          console.log(`✓ Review ${reviewId} updated successfully`);
          
          // Invalidar caché
          if (data.movie_id) {
            await cacheService.invalidateMovieStats(data.movie_id);
          }
          break;

        case 'DELETE':
          console.log(`📝 Processing queued review deletion: ${reviewId}...`);
          await reviewRepository.delete(reviewId);
          console.log(`✓ Review ${reviewId} deleted successfully`);
          break;

        default:
          console.warn(`⚠️ Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error processing review message:', error.message);
      // En producción, podrías enviar a una dead letter queue
      throw error;
    }
  }

  /**
   * Procesar eventos de películas
   */
  async processMovieMessage(message) {
    const { action, data, movieId } = message;

    try {
      switch (action) {
        case 'CREATE':
          console.log('📝 Processing queued movie creation...');
          const movie = await movieRepository.create(data.data);
          console.log(`✓ Movie created successfully: ${movie.id}`);
          
          // Asociar géneros si existen
          if (data.data.genres && data.data.genres.length > 0) {
            await movieRepository.associateGenres(movie.id, data.data.genres);
          }
          
          // Invalidar caché
          await cacheService.delPattern('movies:*');
          break;

        case 'UPDATE':
          console.log(`📝 Processing queued movie update: ${movieId}...`);
          await movieRepository.update(movieId, data);
          console.log(`✓ Movie ${movieId} updated successfully`);
          
          // Actualizar géneros si existen
          if (data.genres) {
            await movieRepository.associateGenres(movieId, data.genres);
          }
          
          // Invalidar caché
          await cacheService.invalidateMovie(movieId);
          break;

        default:
          console.warn(`⚠️ Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error processing movie message:', error.message);
      throw error;
    }
  }

  /**
   * Iniciar el worker
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Kafka consumer worker is already running');
      return;
    }

    try {
      console.log('🚀 Starting Kafka consumer worker...');
      
      // Inicializar productor (para enviar mensajes)
      await kafkaService.initProducer();
      
      // Inicializar consumidor
      await kafkaService.initConsumer('movie-reviews-worker');

      // Suscribirse a todos los topics de una vez
      await kafkaService.subscribeToTopics({
        [kafkaService.TOPICS.REVIEWS]: this.processReviewMessage.bind(this),
        [kafkaService.TOPICS.MOVIES]: this.processMovieMessage.bind(this)
      });

      this.isRunning = true;
      console.log('✓ Kafka consumer worker started successfully');
      console.log('✓ Listening to topics:', Object.values(kafkaService.TOPICS));
    } catch (error) {
      console.error('❌ Error starting Kafka consumer worker:', error.message);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Detener el worker
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Kafka consumer worker is not running');
      return;
    }

    try {
      console.log('🛑 Stopping Kafka consumer worker...');
      await kafkaService.disconnect();
      this.isRunning = false;
      console.log('✓ Kafka consumer worker stopped');
    } catch (error) {
      console.error('❌ Error stopping Kafka consumer worker:', error.message);
    }
  }
}

// Singleton
let workerInstance = null;

module.exports = {
  getKafkaConsumerWorker: () => {
    if (!workerInstance) {
      workerInstance = new KafkaConsumerWorker();
    }
    return workerInstance;
  },
  KafkaConsumerWorker
};
