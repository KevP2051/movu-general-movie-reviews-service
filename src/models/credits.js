const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Credits extends Model { }

Credits.init({
    credit_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    movie_id: { type: DataTypes.INTEGER, allowNull: false },
    people_id: { type: DataTypes.INTEGER, allowNull: false },
    role_type: { type: DataTypes.ENUM('actor', 'writer', 'director', 'producer', 'crew'), defaultValue: 'crew', allowNull: false },
    character_name: { type: DataTypes.STRING, allowNull: true }
}, {
    sequelize,
    modelName: 'credits',
    tableName: 'CREDITS',
    timestamps: true,

});

module.exports = Credits;