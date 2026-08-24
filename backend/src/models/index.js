const sequelize = require('../config/db');
const User = require('./User');
const Event = require('./Event');
const Venue = require('./Venue');

module.exports = { sequelize, User, Event, Venue };
