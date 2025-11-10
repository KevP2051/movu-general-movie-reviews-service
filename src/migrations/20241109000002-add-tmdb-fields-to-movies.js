'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Agregar campos necesarios para TMDB
    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'tmdb_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'title',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'overview',
      {
        type: Sequelize.TEXT,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'runtime',
      {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'original_language',
      {
        type: Sequelize.STRING(10),
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'poster_path',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'MOVIES', schema },
      'backdrop_path',
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

    // Hacer que los campos antiguos sean opcionales
    await queryInterface.changeColumn(
      { tableName: 'MOVIES', schema },
      'director',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.changeColumn(
      { tableName: 'MOVIES', schema },
      'runtime_minutes',
      {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'tmdb_id');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'title');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'overview');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'runtime');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'original_language');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'poster_path');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'backdrop_path');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'popularity');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'vote_average');
    await queryInterface.removeColumn({ tableName: 'MOVIES', schema }, 'vote_count');

    await queryInterface.changeColumn(
      { tableName: 'MOVIES', schema },
      'director',
      {
        type: Sequelize.STRING,
        allowNull: false
      }
    );

    await queryInterface.changeColumn(
      { tableName: 'MOVIES', schema },
      'runtime_minutes',
      {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    );
  }
};
