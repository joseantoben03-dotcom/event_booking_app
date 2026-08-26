const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

class Event extends Model {}

Event.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    venue: { type: DataTypes.STRING(200), allowNull: false },
    event_name: { type: DataTypes.STRING(200), allowNull: false },
    purpose: { type: DataTypes.TEXT, allowNull: false },
    organizer: { type: DataTypes.STRING(150), allowNull: false },
    no_of_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    event_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    hod_approved: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    principal_approved: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    campus_manager_approved: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    hod_approved_at: { type: DataTypes.DATE, allowNull: true },
    principal_approved_at: { type: DataTypes.DATE, allowNull: true },
    campus_manager_approved_at: { type: DataTypes.DATE, allowNull: true },
    is_cancelled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
  }
);

Event.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
User.hasMany(Event, { foreignKey: 'user_id', as: 'events' });

module.exports = Event;
