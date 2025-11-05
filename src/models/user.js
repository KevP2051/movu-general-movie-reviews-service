const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class User extends Model {}

User.init({
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    first_name: { type: DataTypes.STRING, allowNull: true },
    last_name: { type: DataTypes.STRING, allowNull: true },
    profile_picture_url: { type: DataTypes.STRING, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
    sequelize,
    modelName: 'user',
    tableName: 'USERS',
    timestamps: true
});

module.exports = User;
