const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

// Define the Laundry model
const Laundry = sequelize.define('Laundry', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.STRING,
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define association with User model
User.hasMany(Laundry, { foreignKey: 'ownerId', onDelete: 'CASCADE' });
Laundry.belongsTo(User, { foreignKey: 'ownerId' });

module.exports = Laundry;
