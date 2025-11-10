const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Genre extends Model { }

Genre.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'genre_id' },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    tmdb_id: { type: DataTypes.INTEGER, allowNull: true, unique: true },
}, {
    sequelize,
    modelName: 'genre',
    tableName: 'GENRES',
    timestamps: true,
});

module.exports = Genre;