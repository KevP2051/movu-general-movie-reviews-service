const { Movie, Genre, MovieGenre, People, Credits } = require('../models');
const { Op } = require('sequelize');

class MovieRepository {
  /**
   * Obtener todas las películas con paginación
   */
  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Movie.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return {
      movies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar película por ID
   */
  async findById(movieId) {
    return await Movie.findByPk(movieId, {
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        },
        {
          model: People,
          as: 'cast',
          through: {
            as: 'creditInfo',
            attributes: ['role_type', 'character_name']
          }
        }
      ]
    });
  }

  /**
   * Buscar películas por género
   */
  async findByGenre(genreId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Primero obtenemos los IDs de películas que tienen este género
    const movieIds = await MovieGenre.findAll({
      where: { genre_id: parseInt(genreId) },
      attributes: ['movie_id'],
      raw: true
    });

    const ids = movieIds.map(mg => mg.movie_id);

    if (ids.length === 0) {
      return {
        movies: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      };
    }

    // Luego buscamos las películas con esos IDs
    const { count, rows } = await Movie.findAndCountAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      limit,
      offset,
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ],
      order: [['release_date', 'DESC']],
      distinct: true
    });

    return {
      movies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar películas por título (búsqueda parcial)
   */
  async searchByTitle(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Movie.findAndCountAll({
      where: {
        original_title: {
          [Op.iLike]: `%${query}%`
        }
      },
      limit,
      offset,
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ],
      order: [['original_title', 'ASC']]
    });

    return {
      movies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar películas por director
   */
  async findByDirector(director, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Movie.findAndCountAll({
      where: {
        director: {
          [Op.iLike]: `%${director}%`
        }
      },
      limit,
      offset,
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ],
      order: [['release_date', 'DESC']]
    });

    return {
      movies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Buscar películas por año
   */
  async findByYear(year, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Movie.findAndCountAll({
      where: {
        release_date: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`]
        }
      },
      limit,
      offset,
      include: [
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ],
      order: [['release_date', 'ASC']]
    });

    return {
      movies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Crear nueva película
   */
  async create(movieData) {
    return await Movie.create(movieData);
  }

  /**
   * Actualizar película
   */
  async update(movieId, movieData) {
    const movie = await Movie.findByPk(movieId);
    if (!movie) return null;
    
    await movie.update(movieData);
    return movie;
  }

  /**
   * Eliminar película
   */
  async delete(movieId) {
    const movie = await Movie.findByPk(movieId);
    if (!movie) return false;
    
    await movie.destroy();
    return true;
  }

  /**
   * Asociar géneros a una película
   */
  async associateGenres(movieId, genreIds) {
    // Eliminar asociaciones anteriores
    await MovieGenre.destroy({
      where: { movie_id: movieId }
    });

    // Crear nuevas asociaciones
    const associations = genreIds.map(genreId => ({
      movie_id: movieId,
      genre_id: genreId
    }));

    await MovieGenre.bulkCreate(associations);
  }
}

module.exports = new MovieRepository();
