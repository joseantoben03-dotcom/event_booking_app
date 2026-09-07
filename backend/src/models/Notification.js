const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Event = require('./Event');

class Notification extends Model {}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    recipient_id: { type: DataTypes.STRING(20), allowNull: false },
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    message: { type: DataTypes.STRING(255), allowNull: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
  }
);

Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });
Notification.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

module.exports = Notification;