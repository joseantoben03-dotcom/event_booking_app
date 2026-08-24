const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const Venue = require('./Venue');

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
    contactno: { type: DataTypes.STRING(20), allowNull: true },
    designation: {
      type: DataTypes.ENUM('ap', 'hod', 'principal', 'campus_manager', 'admin'),
      allowNull: false,
    },
    department: { type: DataTypes.STRING(100), allowNull: false },
    google_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    avatar_url: { type: DataTypes.TEXT, allowNull: true },
    venue_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

User.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });

module.exports = User;
