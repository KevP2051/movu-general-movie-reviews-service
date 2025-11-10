'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.addColumn(
      { tableName: 'GENRES', schema },
      'tmdb_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true
      }
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';
    
    await queryInterface.removeColumn(
      { tableName: 'GENRES', schema },
      'tmdb_id'
    );
  }
};
