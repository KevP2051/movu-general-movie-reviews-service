'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema: 'general_movie_reviews_service' },
      'average_rating',
      {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: null,
        comment: 'Rating promedio calculado de las reviews'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'MOVIES', schema: 'general_movie_reviews_service' },
      'average_rating'
    );
  }
};
