const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Venue extends Model {}

// Maps to the `venue` table created directly in MySQL:
//   id INT PK AUTO_INCREMENT
//   Venue    VARCHAR(50)   -- venue display name
//   time_    TIMESTAMP
//   date_    DATE
//   status_  TINYINT(1)
// time_/date_/status_ aren't used by the booking flow (bookings live in
// `events`); they're mapped here only so Sequelize doesn't choke on the
// existing columns.
Venue.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: true, field: 'Venue' },
    time_: { type: DataTypes.DATE, allowNull: true },
    date_: { type: DataTypes.DATEONLY, allowNull: true },
    status_: { type: DataTypes.BOOLEAN, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Venue',
    tableName: 'venue',
    timestamps: false,
  }
);

module.exports = Venue;
