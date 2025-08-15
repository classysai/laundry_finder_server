const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    // PK `id` is added automatically by Sequelize unless disabled
    email: { type: DataTypes.STRING, unique: true, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    password: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
  },
  {
    tableName: 'Users',        // match exact SQL table
    timestamps: true,          // createdAt / updatedAt
  }
);

module.exports = User;
