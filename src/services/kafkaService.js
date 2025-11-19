const { Kafka } = require('kafkajs');

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'movu-movie-reviews-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = null;
    this.consumer = null;
    this.isConnected = false;

    // Nombres de los topics
    this.TOPICS = {
      REVIEWS: 'movie-reviews',
      MOVIES: 'movie-updates',
      GENRES: 'genre-updates',
      PEOPLE: 'people-updates'
    };
  }

  /**
   * Inicializar el productor de Kafka
   */
  async initProducer() {
    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000
      });

      await this.producer.connect();
      this.isConnected = true;
      console.log('✓ Kafka Producer connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Error connecting Kafka Producer:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Inicializar el consumidor de Kafka
   */
  async initConsumer(groupId = 'movie-reviews-consumer-group') {
    try {
      this.consumer = this.kafka.consumer({ 
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });

      await this.consumer.connect();
      console.log('✓ Kafka Consumer connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Error connecting Kafka Consumer:', error.message);
      return false;
    }
  }

  /**
   * Verificar si Kafka está disponible
   */
  isAvailable() {
    return this.isConnected && this.producer !== null;
  }

  // ========== PRODUCTORES (Enviar mensajes a la cola) ==========

  /**
   * Enviar evento de creación de reseña a Kafka
   */
  async sendReviewCreate(reviewData) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Kafka producer is not available');
      }

      const message = {
        action: 'CREATE',
        data: reviewData,
        timestamp: new Date().toISOString(),
        service: 'movie-reviews-service'
      };

      await this.producer.send({
        topic: this.TOPICS.REVIEWS,
        messages: [
          {
            key: `review-${reviewData.movie_id}`,
            value: JSON.stringify(message),
            headers: {
              'content-type': 'application/json'
            }
          }
        ]
      });

      console.log(`✓ Review CREATE event sent to Kafka: movie_id=${reviewData.movie_id}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending review create to Kafka:', error.message);
      throw error;
    }
  }

  /**
   * Enviar evento de actualización de reseña a Kafka
   */
  async sendReviewUpdate(reviewId, reviewData) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Kafka producer is not available');
      }

      const message = {
        action: 'UPDATE',
        reviewId,
        data: reviewData,
        timestamp: new Date().toISOString(),
        service: 'movie-reviews-service'
      };

      await this.producer.send({
        topic: this.TOPICS.REVIEWS,
        messages: [
          {
            key: `review-${reviewId}`,
            value: JSON.stringify(message)
          }
        ]
      });

      console.log(`✓ Review UPDATE event sent to Kafka: review_id=${reviewId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending review update to Kafka:', error.message);
      throw error;
    }
  }

  /**
   * Enviar evento de eliminación de reseña a Kafka
   */
  async sendReviewDelete(reviewId) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Kafka producer is not available');
      }

      const message = {
        action: 'DELETE',
        reviewId,
        timestamp: new Date().toISOString(),
        service: 'movie-reviews-service'
      };

      await this.producer.send({
        topic: this.TOPICS.REVIEWS,
        messages: [
          {
            key: `review-${reviewId}`,
            value: JSON.stringify(message)
          }
        ]
      });

      console.log(`✓ Review DELETE event sent to Kafka: review_id=${reviewId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending review delete to Kafka:', error.message);
      throw error;
    }
  }

  /**
   * Enviar evento de actualización de película a Kafka
   */
  async sendMovieUpdate(movieId, movieData) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Kafka producer is not available');
      }

      const message = {
        action: 'UPDATE',
        movieId,
        data: movieData,
        timestamp: new Date().toISOString(),
        service: 'movie-reviews-service'
      };

      await this.producer.send({
        topic: this.TOPICS.MOVIES,
        messages: [
          {
            key: `movie-${movieId}`,
            value: JSON.stringify(message)
          }
        ]
      });

      console.log(`✓ Movie UPDATE event sent to Kafka: movie_id=${movieId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending movie update to Kafka:', error.message);
      throw error;
    }
  }

  // ========== CONSUMIDORES (Procesar mensajes de la cola) ==========

  /**
   * Suscribirse a múltiples topics y procesar mensajes
   */
  async subscribeToTopics(topicHandlers) {
    try {
      if (!this.consumer) {
        await this.initConsumer();
      }

      // Suscribirse a todos los topics primero
      const topics = Object.keys(topicHandlers);
      for (const topic of topics) {
        await this.consumer.subscribe({ 
          topic, 
          fromBeginning: false 
        });
        console.log(`✓ Subscribed to topic: ${topic}`);
      }

      // Luego ejecutar el consumer una sola vez
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = JSON.parse(message.value.toString());
            console.log(`📨 Received message from Kafka topic ${topic}:`, {
              partition,
              offset: message.offset,
              action: value.action
            });

            // Buscar el handler correspondiente al topic
            const handler = topicHandlers[topic];
            if (handler) {
              await handler(value);
            } else {
              console.warn(`⚠️ No handler found for topic: ${topic}`);
            }
          } catch (error) {
            console.error(`❌ Error processing message from topic ${topic}:`, error.message);
          }
        }
      });

      console.log('✓ Kafka consumer is running and listening to:', topics);
    } catch (error) {
      console.error('❌ Error subscribing to topics:', error.message);
      throw error;
    }
  }

  /**
   * Suscribirse a un topic individual (método legacy - usar subscribeToTopics)
   */
  async subscribe(topic, messageHandler) {
    console.warn('⚠️ subscribe() is deprecated. Use subscribeToTopics() instead.');
    return this.subscribeToTopics({ [topic]: messageHandler });
  }

  /**
   * Pausar el consumer (deja de procesar mensajes pero mantiene la conexión)
   */
  async pauseConsumer() {
    if (!this.consumer) {
      throw new Error('Consumer not initialized');
    }
    
    try {
      await this.consumer.pause([
        { topic: this.TOPICS.REVIEWS },
        { topic: this.TOPICS.MOVIES }
      ]);
    } catch (error) {
      console.error('❌ Error pausing consumer:', error.message);
      throw error;
    }
  }

  /**
   * Reanudar el consumer
   */
  async resumeConsumer() {
    if (!this.consumer) {
      throw new Error('Consumer not initialized');
    }
    
    try {
      await this.consumer.resume([
        { topic: this.TOPICS.REVIEWS },
        { topic: this.TOPICS.MOVIES }
      ]);
    } catch (error) {
      console.error('❌ Error resuming consumer:', error.message);
      throw error;
    }
  }

  /**
   * Desconectar productor y consumidor
   */
  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        console.log('✓ Kafka Producer disconnected');
      }
      if (this.consumer) {
        await this.consumer.disconnect();
        console.log('✓ Kafka Consumer disconnected');
      }
      this.isConnected = false;
    } catch (error) {
      console.error('❌ Error disconnecting Kafka:', error.message);
    }
  }
}

// Singleton
let kafkaServiceInstance = null;

module.exports = {
  getKafkaService: () => {
    if (!kafkaServiceInstance) {
      kafkaServiceInstance = new KafkaService();
    }
    return kafkaServiceInstance;
  },
  KafkaService
};
