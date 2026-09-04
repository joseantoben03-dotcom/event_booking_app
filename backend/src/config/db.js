const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectModule: mysql2,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: {
      max: 2,       // Clever Cloud dev plan caps total connections at 5 — keep each
                     // serverless instance's pool small so concurrent invocations don't exceed it
      min: 0,
      acquire: 10000,
      idle: 5000,    // release idle connections quickly instead of holding them open
    },
  }
);

module.exports = sequelize;
