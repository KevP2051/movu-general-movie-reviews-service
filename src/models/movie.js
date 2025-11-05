const{DataTypes,Model} = require('sequelize');
const {sequelize} = require('../config/database');

class Movie extends Model {}

Movie.init({
    movie_id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
    original_title:{type:DataTypes.STRING,allowNull:false},
    director:{type:DataTypes.STRING,allowNull:false},
    release_date:{type:DataTypes.DATEONLY,allowNull:false},
    runtime_minutes:{type:DataTypes.INTEGER,allowNull:false},
    plot_summary:{type:DataTypes.TEXT,allowNull:true},
    poster_url:{type:DataTypes.STRING,allowNull:true},
}, {
    sequelize,
    modelName:'movie',
    tableName:'MOVIES',
    timestamps:true
});

module.exports = Movie;