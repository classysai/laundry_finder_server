const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Laundry = require('./Laundry');

// Define the Booking model
const Booking = sequelize.define('Booking', {
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'accepted']]
    }
  }
}, {
  timestamps: true
});

// Associations
User.hasMany(Booking, { foreignKey: 'userId', onDelete: 'CASCADE' });
Booking.belongsTo(User, { foreignKey: 'userId' });

Laundry.hasMany(Booking, { foreignKey: 'laundryId', onDelete: 'CASCADE' });
Booking.belongsTo(Laundry, { foreignKey: 'laundryId' });

module.exports = Booking;
