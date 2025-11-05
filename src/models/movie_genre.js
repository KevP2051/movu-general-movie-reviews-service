const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
class MovieGenre extends Model { }

MovieGenre.init({
    movie_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    genre_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
}, {
    sequelize,
    modelName: 'movie_genre',
    tableName: 'MOVIE_GENRES',
    timestamps: true,
});

module.exports = MovieGenre;