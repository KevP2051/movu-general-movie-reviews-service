'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Eliminar runtime_minutes (redundante con runtime)
    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'runtime_minutes'
    );

    // Eliminar plot_summary (redundante con overview)
    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema },
      'plot_summary'
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'runtime_minutes',
      {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'plot_summary',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    );
  }
};
