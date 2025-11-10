const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Credits extends Model { }

Credits.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'credit_id' },
    movie_id: { type: DataTypes.INTEGER, allowNull: false },
    person_id: { type: DataTypes.INTEGER, allowNull: false, field: 'people_id' },
    role_type: { type: DataTypes.ENUM('actor', 'writer', 'director', 'producer', 'crew'), defaultValue: 'crew', allowNull: false },
    character_name: { type: DataTypes.STRING, allowNull: true }
}, {
    sequelize,
    modelName: 'credits',
    tableName: 'CREDITS',
    timestamps: true,

});

module.exports = Credits;