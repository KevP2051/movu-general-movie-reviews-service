const peopleService = require('../services/peopleService');

class PeopleController {
  async getAllPeople(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await peopleService.getAllPeople(page, limit);

      res.status(200).json({
        success: true,
        data: result.people,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPersonById(req, res) {
    try {
      const person = await peopleService.getPersonById(req.params.id);

      res.status(200).json({
        success: true,
        data: person
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async searchPeople(req, res) {
    try {
      const query = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await peopleService.searchPeople(query, page, limit);

      res.status(200).json({
        success: true,
        data: result.people,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPersonMovies(req, res) {
    try {
      const roleType = req.query.role;
      const credits = await peopleService.getPersonMovies(req.params.id, roleType);

      res.status(200).json({
        success: true,
        data: credits
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async createPerson(req, res) {
    try {
      const person = await peopleService.createPerson(req.body);

      res.status(201).json({
        success: true,
        data: person
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updatePerson(req, res) {
    try {
      const person = await peopleService.updatePerson(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: person
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async deletePerson(req, res) {
    try {
      const result = await peopleService.deletePerson(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PeopleController();
