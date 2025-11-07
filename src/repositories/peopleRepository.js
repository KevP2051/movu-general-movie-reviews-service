const { People, Movie, Credits } = require('../models');
const { Op } = require('sequelize');

class PeopleRepository {
  /**
   * Obtener todas las personas con paginación
   */
  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await People.findAndCountAll({
      limit,
      offset,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    return {
      people: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar persona por ID
   */
  async findById(peopleId) {
    return await People.findByPk(peopleId, {
      include: [
        {
          model: Movie,
          as: 'movies',
          through: {
            as: 'creditInfo',
            attributes: ['role_type', 'character_name']
          }
        }
      ]
    });
  }

  /**
   * Buscar personas por nombre
   */
  async searchByName(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await People.findAndCountAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit,
      offset,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    return {
      people: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Obtener películas donde participó una persona
   */
  async getMoviesByPerson(peopleId, roleType = null) {
    const where = { people_id: peopleId };
    if (roleType) where.role_type = roleType;

    return await Credits.findAll({
      where,
      include: [
        {
          model: Movie,
          as: 'movie'
        }
      ],
      order: [[{ model: Movie, as: 'movie' }, 'release_date', 'DESC']]
    });
  }

  /**
   * Crear nueva persona
   */
  async create(personData) {
    return await People.create(personData);
  }

  /**
   * Actualizar persona
   */
  async update(peopleId, personData) {
    const person = await People.findByPk(peopleId);
    if (!person) return null;
    
    await person.update(personData);
    return person;
  }

  /**
   * Eliminar persona
   */
  async delete(peopleId) {
    const person = await People.findByPk(peopleId);
    if (!person) return false;
    
    await person.destroy();
    return true;
  }
}

module.exports = new PeopleRepository();
