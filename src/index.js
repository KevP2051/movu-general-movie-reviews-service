const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./config/database');
const corsOptions = require('./config/cors');
const { extractUserFromHeaders } = require('./middleware/gateway');

const app = express();

// Middleware
app.use(cors(corsOptions)); // CORS configurado para el gateway
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware con correlation ID
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 'N/A';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} [${correlationId}]`);
  next();
});

// Middleware para extraer información del usuario desde headers del gateway
app.use(extractUserFromHeaders);

// Health check endpoint (usado por el gateway para verificar el estado del servicio)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'movies-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
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
      health: '/api/health'
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
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
