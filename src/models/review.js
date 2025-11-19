const {DataTypes , Model} = require('sequelize');
const {sequelize} = require('../config/database');

class Review extends Model {}

Review.init({
    review_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    movie_id: {type: DataTypes.INTEGER, allowNull: false},
    user_id: {type: DataTypes.INTEGER, allowNull: false},
    rating: {type: DataTypes.INTEGER, allowNull: false},
    title: {type: DataTypes.STRING, allowNull: false},
    content: {type: DataTypes.TEXT, allowNull: true},
    hasSpoiler: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    status: {type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), allowNull: false, defaultValue: 'APPROVED'},

}, {
    sequelize,
    modelName: 'review',
    tableName: 'REVIEWS',
    timestamps: true
});

module.exports = Review;