const {DataTypes, Model} = require('sequelize');
const {sequelize} = require('../config/database');

class People extends Model {}
People.init({
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'people_id'},
    name: {type: DataTypes.STRING, allowNull: true},
    first_name: {type: DataTypes.STRING, allowNull: true},
    last_name: {type: DataTypes.STRING, allowNull: true},
    tmdb_id: {type: DataTypes.INTEGER, allowNull: true, unique: true},
    profile_path: {type: DataTypes.STRING, allowNull: true}},{
    sequelize,
    modelName: 'people',
    tableName: 'PEOPLE',
    timestamps: true
});

module.exports = People;