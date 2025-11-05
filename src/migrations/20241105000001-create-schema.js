'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Crear el esquema si no existe usando SQL directo
    await queryInterface.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Opcional: Eliminar el esquema (comentado por seguridad)
    // await queryInterface.dropSchema(schema, { ifExists: true });
  }
};
