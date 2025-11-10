const{DataTypes,Model} = require('sequelize');
const {sequelize} = require('../config/database');

class Movie extends Model {}

Movie.init({
    id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true,field:'movie_id'},
    title:{type:DataTypes.STRING,allowNull:true},
    original_title:{type:DataTypes.STRING,allowNull:false},
    overview:{type:DataTypes.TEXT,allowNull:true},
    release_date:{type:DataTypes.DATEONLY,allowNull:false},
    runtime:{type:DataTypes.INTEGER,allowNull:true},
    original_language:{type:DataTypes.STRING,allowNull:true},
    poster_path:{type:DataTypes.STRING,allowNull:true},
    backdrop_path:{type:DataTypes.STRING,allowNull:true},
    tmdb_id:{type:DataTypes.INTEGER,allowNull:true,unique:true},
}, {
    sequelize,
    modelName:'movie',
    tableName:'MOVIES',
    timestamps:true
});

module.exports = Movie;