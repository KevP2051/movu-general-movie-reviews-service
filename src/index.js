const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./config/database');
const { getCacheService } = require('./services/cacheService');
const { getKafkaService } = require('./services/kafkaService');
const { getResilienceService } = require('./services/resilienceService');
const { getKafkaConsumerWorker } = require('./workers/kafkaConsumerWorker');

const cacheService = getCacheService();
const kafkaService = getKafkaService();
const resilienceService = getResilienceService();
const kafkaConsumerWorker = getKafkaConsumerWorker();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Movu - General Movie Reviews Service',
    version: '1.0.0',
    endpoints: {
      movies: '/api/movies',
      reviews: '/api/reviews',
      genres: '/api/genres',
      people: '/api/people',
      health: '/api/health',
      resilience: '/api/resilience/status'
    }
  });
});

// Resilience status endpoint
app.get('/api/resilience/status', (req, res) => {
  const stats = resilienceService.getStats();
  res.json({
    success: true,
    resilience: {
      databaseStatus: resilienceService.isDatabaseAvailable() ? 'UP' : 'DOWN',
      circuitBreakers: stats.breakers,
      totalBreakers: stats.totalBreakers,
      cache: {
        status: cacheService.redis && cacheService.redis.status === 'ready' ? 'CONNECTED' : 'DISCONNECTED'
      },
      kafka: {
        producer: kafkaService.isAvailable() ? 'CONNECTED' : 'DISCONNECTED',
        consumer: kafkaConsumerWorker.isRunning ? 'RUNNING' : 'STOPPED'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference - related record does not exist'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('🚀 Starting Movu General Movie Reviews Service...\n');

    // 1. Test database connection
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.warn('⚠️  Database connection failed (will run in degraded mode)');
      console.warn('   Error:', error.message);
    }

    // 2. Initialize Redis cache
    try {
      const isRedisAvailable = await cacheService.isAvailable();
      if (isRedisAvailable) {
        console.log('✅ Redis cache connected successfully');
      } else {
        console.warn('⚠️  Redis connection failed (caching disabled)');
      }
    } catch (error) {
      console.warn('⚠️  Redis connection failed (caching disabled)');
      console.warn('   Error:', error.message);
    }

    // 3. Initialize Kafka producer
    try {
      await kafkaService.initProducer();
      console.log('✅ Kafka producer initialized successfully');
    } catch (error) {
      console.warn('⚠️  Kafka producer initialization failed');
      console.warn('   Error:', error.message);
    }

    // 4. Start Kafka consumer worker (for processing queued messages)
    try {
      await kafkaConsumerWorker.start();
      console.log('✅ Kafka consumer worker started successfully');
    } catch (error) {
      console.warn('⚠️  Kafka consumer worker failed to start');
      console.warn('   Error:', error.message);
    }

    // 5. Start database health monitoring (Circuit Breaker)
    try {
      resilienceService.startDatabaseMonitoring(5000);
      console.log('✅ Database health monitoring started');
    } catch (error) {
      console.warn('⚠️  Database monitoring failed to start');
      console.warn('   Error:', error.message);
    }

    console.log('\n📊 Resilience features:');
    console.log('   • Circuit Breaker: Active');
    console.log('   • Redis Cache: ' + (await cacheService.isAvailable() ? 'Active' : 'Disabled'));
    console.log('   • Kafka Queue: ' + (kafkaService.isAvailable() ? 'Active' : 'Disabled'));
    console.log('   • Auto-recovery: Enabled');

    // 6. Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔄 Resilience status: http://localhost:${PORT}/api/resilience/status`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      try {
        // Stop accepting new requests
        console.log('Stopping Kafka consumer worker...');
        await kafkaConsumerWorker.stop();
        
        console.log('Disconnecting Kafka...');
        await kafkaService.disconnect();
        
        console.log('Disconnecting Redis...');
        await cacheService.disconnect();
        
        console.log('Closing database connection...');
        await sequelize.close();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
