'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    await queryInterface.createTable('CREDITS', {
      credit_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      movie_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'MOVIES',
            schema: schema
          },
          key: 'movie_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      people_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'PEOPLE',
            schema: schema
          },
          key: 'people_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role_type: {
        type: Sequelize.ENUM('actor', 'writer', 'director', 'producer', 'crew'),
        defaultValue: 'crew',
        allowNull: false
      },
      character_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, { schema });

    // Índices para CREDITS
    await queryInterface.addIndex(
      { tableName: 'CREDITS', schema },
      ['movie_id'],
      { name: 'idx_credits_movie_id' }
    );

    await queryInterface.addIndex(
      { tableName: 'CREDITS', schema },
      ['people_id'],
      { name: 'idx_credits_people_id' }
    );
  },

  async down(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';
    await queryInterface.dropTable({ tableName: 'CREDITS', schema });
  }
};
