const { Genre, Movie } = require('../models');

class GenreRepository {
  /**
   * Obtener todos los géneros
   */
  async findAll() {
    return await Genre.findAll({
      order: [['name', 'ASC']]
    });
  }

  /**
   * Buscar género por ID
   */
  async findById(genreId) {
    return await Genre.findByPk(genreId);
  }

  /**
   * Buscar género por nombre
   */
  async findByName(name) {
    return await Genre.findOne({
      where: { name }
    });
  }

  /**
   * Obtener géneros con conteo de películas
   */
  async findAllWithMovieCount() {
    return await Genre.findAll({
      attributes: [
        'genre_id',
        'name',
        [Genre.sequelize.fn('COUNT', Genre.sequelize.col('movies.movie_id')), 'movie_count']
      ],
      include: [
        {
          model: Movie,
          as: 'movies',
          attributes: [],
          through: { attributes: [] }
        }
      ],
      group: ['Genre.genre_id', 'Genre.name'],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Crear nuevo género
   */
  async create(genreData) {
    return await Genre.create(genreData);
  }

  /**
   * Actualizar género
   */
  async update(genreId, genreData) {
    const genre = await Genre.findByPk(genreId);
    if (!genre) return null;
    
    await genre.update(genreData);
    return genre;
  }

  /**
   * Eliminar género
   */
  async delete(genreId) {
    const genre = await Genre.findByPk(genreId);
    if (!genre) return false;
    
    await genre.destroy();
    return true;
  }
}

module.exports = new GenreRepository();
