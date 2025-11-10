'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Eliminar columna director (redundante, ahora está en credits)
    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'director'
    );

    // Eliminar campos de rating de TMDB (se calcularán desde reviews propias)
    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'popularity'
    );

    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'vote_average'
    );

    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'vote_count'
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'director',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'popularity',
      {
        type: Sequelize.FLOAT,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'vote_average',
      {
        type: Sequelize.FLOAT,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'vote_count',
      {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    );
  }
};
