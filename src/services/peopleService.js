const peopleRepository = require('../repositories/peopleRepository');

class PeopleService {
  async getAllPeople(page, limit) {
    return await peopleRepository.findAll(page, limit);
  }

  async getPersonById(peopleId) {
    const person = await peopleRepository.findById(peopleId);
    if (!person) {
      throw new Error('Person not found');
    }
    return person;
  }

  async searchPeople(query, page, limit) {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }
    return await peopleRepository.searchByName(query, page, limit);
  }

  async getPersonMovies(peopleId, roleType) {
    const person = await peopleRepository.findById(peopleId);
    if (!person) {
      throw new Error('Person not found');
    }

    return await peopleRepository.getMoviesByPerson(peopleId, roleType);
  }

  async createPerson(personData) {
    if (!personData.first_name || !personData.last_name || !personData.birth_date) {
      throw new Error('Missing required fields: first_name, last_name, birth_date');
    }

    return await peopleRepository.create(personData);
  }

  async updatePerson(peopleId, personData) {
    const person = await peopleRepository.update(peopleId, personData);
    if (!person) {
      throw new Error('Person not found');
    }
    return person;
  }

  async deletePerson(peopleId) {
    const deleted = await peopleRepository.delete(peopleId);
    if (!deleted) {
      throw new Error('Person not found');
    }
    return { message: 'Person deleted successfully' };
  }
}

module.exports = new PeopleService();
