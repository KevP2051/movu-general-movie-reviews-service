'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Eliminar poster_url de movies (redundante con poster_path)
    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'poster_url'
    );

    // Eliminar birth_date de people (no disponible en credits API)
    await queryInterface.removeColumn(
      { tableName: 'PEOPLE', schema },
      'birth_date'
    );

    // Eliminar biography de people (no disponible en credits API)
    await queryInterface.removeColumn(
      { tableName: 'PEOPLE', schema },
      'biography'
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'poster_url',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'PEOPLE', schema },
      'birth_date',
      {
        type: Sequelize.DATEONLY,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'PEOPLE', schema },
      'biography',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    );
  }
};
