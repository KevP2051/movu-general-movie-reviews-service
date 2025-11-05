'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    const genres = [
      { name: 'Action', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Adventure', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Comedy', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Drama', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Fantasy', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Horror', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mystery', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Romance', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Science Fiction', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Thriller', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Western', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Animation', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Documentary', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Musical', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Crime', createdAt: new Date(), updatedAt: new Date() }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'GENRES', schema },
      genres,
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.bulkDelete(
      { tableName: 'GENRES', schema },
      null,
      {}
    );
  }
};
