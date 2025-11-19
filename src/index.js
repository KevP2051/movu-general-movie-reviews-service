const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./config/database');
const { getCacheService } = require('./services/cacheService');
const { getKafkaService } = require('./services/kafkaService');
const { getResilienceService } = require('./services/resilienceService');
const { getCacheWarmingService } = require('./services/cacheWarmingService');
const { getKafkaConsumerWorker } = require('./workers/kafkaConsumerWorker');
const client = require('prom-client');

const cacheService = getCacheService();
const kafkaService = getKafkaService();
const resilienceService = getResilienceService();
const cacheWarmingService = getCacheWarmingService();
const kafkaConsumerWorker = getKafkaConsumerWorker();

const app = express();

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Custom HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Histogram for HTTP request duration (latencia)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging & metrics middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Log detallado para POST /api/reviews
  if (req.method === 'POST' && req.path.includes('/reviews')) {
    console.log('🎯 [Middleware] POST a reviews detectado');
    console.log('📋 Content-Type:', req.headers['content-type']);
    console.log('📏 Content-Length:', req.headers['content-length']);
  }
  
  // Latencia
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.route ? req.route.path : req.path });
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });
    end({ status: res.statusCode });
  });
  
  res.on('close', () => {
    if (!res.writableEnded) {
      console.error('⚠️ [Middleware] Conexión cerrada antes de enviar respuesta:', req.method, req.path);
    }
  });
  
  next();
});
// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Mount API routes
app.use('/api', routes);

// Error handler middleware (debe ir DESPUÉS de las rutas)
app.use((err, req, res, next) => {
  console.error('🚨 [Error Handler] Error no manejado:');
  console.error('   Path:', req.method, req.path);
  console.error('   Error:', err.message);
  console.error('   Stack:', err.stack);
  
  // Si ya se enviaron headers, delegar al handler por defecto
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    path: req.path
  });
});

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
      console.log('Database connection established successfully');
    } catch (error) {
      console.warn('Database connection failed (will run in degraded mode)');
      console.warn('   Error:', error.message);
    }

    // 2. Initialize Redis cache
    try {
      const isRedisAvailable = await cacheService.isAvailable();
      if (isRedisAvailable) {
        console.log('Redis cache connected successfully');
      } else {
        console.warn('Redis connection failed (caching disabled)');
      }
    } catch (error) {
      console.warn('Redis connection failed (caching disabled)');
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
      // Registrar el Kafka worker para que se pause/reanude automáticamente
      resilienceService.registerKafkaWorker(kafkaConsumerWorker);
      
      resilienceService.startDatabaseMonitoring(5000);
      console.log('✅ Database health monitoring started');
    } catch (error) {
      console.warn('⚠️  Database monitoring failed to start');
      console.warn('   Error:', error.message);
    }

    // 6. Warm cache automatically (only if DB is available)
    const isDbAvailable = resilienceService.isDatabaseAvailable();
    const isCacheAvailable = await cacheService.isAvailable();
    
    if (isDbAvailable && isCacheAvailable) {
      console.log('\n🔥 Precalentando caché automáticamente...');
      // Ejecutar en background para no bloquear el inicio del servidor
      cacheWarmingService.warmAllCache().catch(err => {
        console.warn('⚠️  Cache warming failed (server will continue):', err.message);
      });
    } else {
      if (!isDbAvailable) {
        console.warn('⚠️  Skipping cache warming - Database not available');
      }
      if (!isCacheAvailable) {
        console.warn('⚠️  Skipping cache warming - Redis not available');
      }
    }

    console.log('\n📊 Resilience features:');
    console.log('   • Circuit Breaker: Active');
    console.log('   • Redis Cache: ' + (isCacheAvailable ? 'Active' : 'Disabled'));
    console.log('   • Kafka Queue: ' + (kafkaService.isAvailable() ? 'Active' : 'Disabled'));
    console.log('   • Auto-recovery: Enabled');
    console.log('   • Auto cache-warming: ' + (isDbAvailable && isCacheAvailable ? 'Enabled' : 'Disabled'));

    // 7. Start HTTP server
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
