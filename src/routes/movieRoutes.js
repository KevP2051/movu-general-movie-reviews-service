const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

/**
 * @route   GET /api/movies
 * @desc    Get all movies with pagination
 * @query   page, limit
 * @access  Public
 */
router.get('/', movieController.getAllMovies);

/**
 * @route   GET /api/movies/search
 * @desc    Search movies by title
 * @query   q (search query), page, limit
 * @access  Public
 */
router.get('/search', movieController.searchMovies);

/**
 * @route   GET /api/movies/director
 * @desc    Get movies by director
 * @query   director, page, limit
 * @access  Public
 */
router.get('/director', movieController.getMoviesByDirector);

/**
 * @route   GET /api/movies/year/:year
 * @desc    Get movies by year
 * @params  year
 * @query   page, limit
 * @access  Public
 */
router.get('/year/:year', movieController.getMoviesByYear);

/**
 * @route   GET /api/movies/genre/:genreId
 * @desc    Get movies by genre
 * @params  genreId
 * @query   page, limit
 * @access  Public
 */
router.get('/genre/:genreId', movieController.getMoviesByGenre);

/**
 * @route   GET /api/movies/:id
 * @desc    Get movie by ID
 * @params  id
 * @access  Public
 */
router.get('/:id', movieController.getMovieById);

/**
 * @route   POST /api/movies
 * @desc    Create a new movie
 * @body    movie data
 * @access  Private (Admin)
 */
router.post('/', movieController.createMovie);

/**
 * @route   PUT /api/movies/:id
 * @desc    Update movie
 * @params  id
 * @body    movie data
 * @access  Private (Admin)
 */
router.put('/:id', movieController.updateMovie);

/**
 * @route   DELETE /api/movies/:id
 * @desc    Delete movie
 * @params  id
 * @access  Private (Admin)
 */
router.delete('/:id', movieController.deleteMovie);

module.exports = router;
