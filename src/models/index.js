const sequelize = require('../config/database');

const Movie = require('./movie');
const Genre = require('./genre');
const MovieGenre = require('./movie_genre');
const Review = require('./review');
const People = require('./people');
const Credits = require('./credits');

Movie.belongsToMany(Genre, {
  through: MovieGenre,
  foreignKey: 'movie_id',
  otherKey: 'genre_id',
  as: 'genres'
});

Genre.belongsToMany(Movie, {
  through: MovieGenre,
  foreignKey: 'genre_id',
  otherKey: 'movie_id',
  as: 'movies'
});

Movie.hasMany(Review, {
  foreignKey: 'movie_id',
  as: 'reviews',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Review.belongsTo(Movie, {
  foreignKey: 'movie_id',
  as: 'movie'
});

// Nota: No hay relación con User porque está en otro microservicio
// user_id es solo una referencia externa

Movie.belongsToMany(People, {
  through: Credits,
  foreignKey: 'movie_id',
  otherKey: 'people_id',
  as: 'cast'
});

People.belongsToMany(Movie, {
  through: Credits,
  foreignKey: 'people_id',
  otherKey: 'movie_id',
  as: 'movies'
});

Movie.hasMany(Credits, {
  foreignKey: 'movie_id',
  as: 'credits',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Credits.belongsTo(Movie, {
  foreignKey: 'movie_id',
  as: 'movie'
});

People.hasMany(Credits, {
  foreignKey: 'people_id',
  as: 'credits',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Credits.belongsTo(People, {
  foreignKey: 'people_id',
  as: 'person'
});

module.exports = {
  sequelize,
  Movie,
  Genre,
  MovieGenre,
  Review,
  People,
  Credits
};
