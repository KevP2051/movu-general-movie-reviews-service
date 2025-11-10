'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Agregar campo tmdb_id
    await queryInterface.addColumn(
      { tableName: 'PEOPLE', schema },
      'tmdb_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true
      }
    );

    // Agregar campo name (nombre completo)
    await queryInterface.addColumn(
      { tableName: 'PEOPLE', schema },
      'name',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    // Agregar profile_path
    await queryInterface.addColumn(
      { tableName: 'PEOPLE', schema },
      'profile_path',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    // Hacer campos opcionales para compatibilidad con TMDB
    await queryInterface.changeColumn(
      { tableName: 'PEOPLE', schema },
      'first_name',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.changeColumn(
      { tableName: 'PEOPLE', schema },
      'last_name',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.changeColumn(
      { tableName: 'PEOPLE', schema },
      'birth_date',
      {
        type: Sequelize.DATEONLY,
        allowNull: true
      }
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.removeColumn({ tableName: 'PEOPLE', schema }, 'tmdb_id');
    await queryInterface.removeColumn({ tableName: 'PEOPLE', schema }, 'name');
    await queryInterface.removeColumn({ tableName: 'PEOPLE', schema }, 'profile_path');

    await queryInterface.changeColumn(
      { tableName: 'PEOPLE', schema },
      'first_name',
      {
        type: Sequelize.STRING,
        allowNull: false
      }
    );

    await queryInterface.changeColumn(
      { tableName: 'PEOPLE', schema },
      'last_name',
      {
        type: Sequelize.STRING,
        allowNull: false
      }
    );

    await queryInterface.changeColumn(
      { tableName: 'PEOPLE', schema },
      'birth_date',
      {
        type: Sequelize.DATEONLY,
        allowNull: false
      }
    );
  }
};
