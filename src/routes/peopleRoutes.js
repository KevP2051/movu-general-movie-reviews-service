const express = require('express');
const router = express.Router();
const peopleController = require('../controllers/peopleController');

/**
 * @route   GET /api/people
 * @desc    Get all people with pagination
 * @query   page, limit
 * @access  Public
 */
router.get('/', peopleController.getAllPeople);

/**
 * @route   GET /api/people/search
 * @desc    Search people by name
 * @query   q (search query), page, limit
 * @access  Public
 */
router.get('/search', peopleController.searchPeople);

/**
 * @route   GET /api/people/:id
 * @desc    Get person by ID
 * @params  id
 * @access  Public
 */
router.get('/:id', peopleController.getPersonById);

/**
 * @route   GET /api/people/:id/movies
 * @desc    Get movies where person participated
 * @params  id
 * @query   role (filter by role_type)
 * @access  Public
 */
router.get('/:id/movies', peopleController.getPersonMovies);

/**
 * @route   POST /api/people
 * @desc    Create a new person
 * @body    person data
 * @access  Private (Admin)
 */
router.post('/', peopleController.createPerson);

/**
 * @route   PUT /api/people/:id
 * @desc    Update person
 * @params  id
 * @body    person data
 * @access  Private (Admin)
 */
router.put('/:id', peopleController.updatePerson);

/**
 * @route   DELETE /api/people/:id
 * @desc    Delete person
 * @params  id
 * @access  Private (Admin)
 */
router.delete('/:id', peopleController.deletePerson);

module.exports = router;
