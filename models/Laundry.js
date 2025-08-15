const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Laundry = sequelize.define(
  'Laundry',
  {
    // PK `id` auto
    name: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    imageUrl: { type: DataTypes.STRING(512), allowNull: true },
    lat: { type: DataTypes.FLOAT, allowNull: true },
    lng: { type: DataTypes.FLOAT, allowNull: true },
    // `ownerId` handled via association
  },
  {
    tableName: 'Laundries',
    timestamps: true,
  }
);

// Associations (mirror FK: Laundries.ownerId -> Users.id)
// ON DELETE SET NULL, ON UPDATE CASCADE
User.hasMany(Laundry, {
  foreignKey: { name: 'ownerId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: true,
});
Laundry.belongsTo(User, {
  foreignKey: { name: 'ownerId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: true,
});

module.exports = Laundry;
