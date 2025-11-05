'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'general_movie_reviews_service';

    // Crear tabla USERS
    await queryInterface.createTable('USERS', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profile_picture_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Crear tabla MOVIES
    await queryInterface.createTable('MOVIES', {
      movie_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      original_title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      director: {
        type: Sequelize.STRING,
        allowNull: false
      },
      release_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      runtime_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      plot_summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      poster_url: {
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

    // Crear tabla GENRES
    await queryInterface.createTable('GENRES', {
      genre_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

    // Crear tabla MOVIE_GENRES
    await queryInterface.createTable('MOVIE_GENRES', {
      movie_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
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
      genre_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: {
            tableName: 'GENRES',
            schema: schema
          },
          key: 'genre_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Crear tabla PEOPLE
    await queryInterface.createTable('PEOPLE', {
      people_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      biography: {
        type: Sequelize.TEXT,
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

    // Crear tabla CREDITS
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

    // Crear tabla REVIEWS
    await queryInterface.createTable('REVIEWS', {
      review_id: {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'USERS',
            schema: schema
          },
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hasSpoiler: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING'
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

    // Crear índices
    await queryInterface.addIndex(
      { tableName: 'USERS', schema },
      ['email'],
      { name: 'idx_users_email' }
    );

    await queryInterface.addIndex(
      { tableName: 'USERS', schema },
      ['username'],
      { name: 'idx_users_username' }
    );

    await queryInterface.addIndex(
      { tableName: 'REVIEWS', schema },
      ['movie_id'],
      { name: 'idx_reviews_movie_id' }
    );

    await queryInterface.addIndex(
      { tableName: 'REVIEWS', schema },
      ['user_id'],
      { name: 'idx_reviews_user_id' }
    );

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

    // Eliminar tablas en orden inverso (por las foreign keys)
    await queryInterface.dropTable({ tableName: 'REVIEWS', schema });
    await queryInterface.dropTable({ tableName: 'CREDITS', schema });
    await queryInterface.dropTable({ tableName: 'MOVIE_GENRES', schema });
    await queryInterface.dropTable({ tableName: 'PEOPLE', schema });
    await queryInterface.dropTable({ tableName: 'GENRES', schema });
    await queryInterface.dropTable({ tableName: 'MOVIES', schema });
    await queryInterface.dropTable({ tableName: 'USERS', schema });

    // Opcional: Eliminar el esquema (comentado por seguridad)
    // await queryInterface.dropSchema(schema, { ifExists: true });
  }
};
