const express = require('express');
const router = express.Router();

const movieRoutes = require('./movieRoutes');
const reviewRoutes = require('./reviewRoutes');
const genreRoutes = require('./genreRoutes');
const peopleRoutes = require('./peopleRoutes');

// Mount routes
router.use('/movies', movieRoutes);
router.use('/reviews', reviewRoutes);
router.use('/genres', genreRoutes);
router.use('/people', peopleRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Movie Reviews Service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
