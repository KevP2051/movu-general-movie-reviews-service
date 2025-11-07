const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');

/**
 * @route   GET /api/genres
 * @desc    Get all genres
 * @query   withCount (boolean) - include movie count
 * @access  Public
 */
router.get('/', genreController.getAllGenres);

/**
 * @route   GET /api/genres/:id
 * @desc    Get genre by ID
 * @params  id
 * @access  Public
 */
router.get('/:id', genreController.getGenreById);

/**
 * @route   POST /api/genres
 * @desc    Create a new genre
 * @body    genre data
 * @access  Private (Admin)
 */
router.post('/', genreController.createGenre);

/**
 * @route   PUT /api/genres/:id
 * @desc    Update genre
 * @params  id
 * @body    genre data
 * @access  Private (Admin)
 */
router.put('/:id', genreController.updateGenre);

/**
 * @route   DELETE /api/genres/:id
 * @desc    Delete genre
 * @params  id
 * @access  Private (Admin)
 */
router.delete('/:id', genreController.deleteGenre);

module.exports = router;
