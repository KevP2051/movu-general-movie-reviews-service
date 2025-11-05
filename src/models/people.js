const {DataTypes, Model} = require('sequelize');
const {sequelize} = require('../config/database');

class People extends Model {}
People.init({
    people_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    first_name: {type: DataTypes.STRING, allowNull: false},
    last_name: {type: DataTypes.STRING, allowNull: false},
    birth_date: {type: DataTypes.DATEONLY, allowNull: false},
    biography: {type: DataTypes.TEXT, allowNull: true}},{
    sequelize,
    modelName: 'people',
    tableName: 'PEOPLE',
    timestamps: true
});

module.exports = People;