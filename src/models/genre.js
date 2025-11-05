const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Genre extends Model { }

Genre.init({
    genre_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
    sequelize,
    modelName: 'genre',
    tableName: 'GENRES',
    timestamps: true,
});

module.exports = Genre;