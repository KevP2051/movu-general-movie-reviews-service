const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with filters
 * @query   page, limit, status, hasSpoiler
 * @access  Public
 */
router.get('/', reviewController.getAllReviews);

/**
 * @route   GET /api/reviews/rating
 * @desc    Get reviews by rating range
 * @query   min, max, page, limit
 * @access  Public
 */
router.get('/rating', reviewController.getReviewsByRating);

/**
 * @route   GET /api/reviews/movie/:movieId
 * @desc    Get reviews for a specific movie
 * @params  movieId
 * @query   page, limit, status
 * @access  Public
 */
router.get('/movie/:movieId', reviewController.getReviewsByMovie);

/**
 * @route   GET /api/reviews/movie/:movieId/stats
 * @desc    Get review statistics for a movie
 * @params  movieId
 * @access  Public
 */
router.get('/movie/:movieId/stats', reviewController.getMovieStats);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews by user
 * @params  userId
 * @query   page, limit
 * @access  Public
 */
router.get('/user/:userId', reviewController.getReviewsByUser);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get review by ID
 * @params  id
 * @access  Public
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @body    review data
 * @access  Private (Authenticated User)
 */
router.post('/', reviewController.createReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update review
 * @params  id
 * @body    review data
 * @access  Private (Owner only)
 */
router.put('/:id', reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @params  id
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', reviewController.deleteReview);

/**
 * @route   PATCH /api/reviews/:id/approve
 * @desc    Approve a review
 * @params  id
 * @access  Private (Admin)
 */
router.patch('/:id/approve', reviewController.approveReview);

/**
 * @route   PATCH /api/reviews/:id/reject
 * @desc    Reject a review
 * @params  id
 * @access  Private (Admin)
 */
router.patch('/:id/reject', reviewController.rejectReview);

module.exports = router;
