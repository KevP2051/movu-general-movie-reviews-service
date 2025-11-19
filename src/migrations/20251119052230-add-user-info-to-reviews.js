'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'REVIEWS', schema: 'general_movie_reviews_service' },
      'user_email',
      {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Email del usuario que creó la review'
      }
    );

    await queryInterface.addColumn(
      { tableName: 'REVIEWS', schema: 'general_movie_reviews_service' },
      'user_name',
      {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nombre del usuario que creó la review'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'REVIEWS', schema: 'general_movie_reviews_service' },
      'user_email'
    );
    
    await queryInterface.removeColumn(
      { tableName: 'REVIEWS', schema: 'general_movie_reviews_service' },
      'user_name'
    );
  }
};
