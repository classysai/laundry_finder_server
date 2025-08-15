// models/Booking.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Laundry = require('./Laundry');

const Booking = sequelize.define(
  'Booking',
  {
    // PK `id` auto
    status: { type: DataTypes.STRING, defaultValue: 'pending', allowNull: true }, // VARCHAR in SQL
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    serviceType: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    // `userId`, `laundryId` via associations
  },
  {
    tableName: 'Bookings',  // <- match dump
    timestamps: true,
  }
);

// Associations mirroring: ON DELETE SET NULL, ON UPDATE CASCADE
User.hasMany(Booking, {
  as: 'UserBookings',
  foreignKey: { name: 'userId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: true,
});
Booking.belongsTo(User, {
  as: 'User',
  foreignKey: { name: 'userId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: true,
});

Laundry.hasMany(Booking, {
  as: 'LaundryBookings',
  foreignKey: { name: 'laundryId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: true,
});
Booking.belongsTo(Laundry, {
  as: 'Laundry',
  foreignKey: { name: 'laundryId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: true,
});

module.exports = Booking;
