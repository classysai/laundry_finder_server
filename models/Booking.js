// models/Booking.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Laundry = require('./Laundry');

const Booking = sequelize.define('Booking', {
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  }
}, {
  timestamps: true
});

// Associations
User.hasMany(Booking, { as: 'UserBookings', foreignKey: 'userId', onDelete: 'CASCADE' });
Booking.belongsTo(User, { as: 'User', foreignKey: 'userId' });

Laundry.hasMany(Booking, { as: 'LaundryBookings', foreignKey: 'laundryId', onDelete: 'CASCADE' });
Booking.belongsTo(Laundry, { as: 'Laundry', foreignKey: 'laundryId' });

module.exports = Booking;
