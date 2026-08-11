require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-change-me',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1d',
  SALT_ROUNDS: Number(process.env.SALT_ROUNDS) || 10,
};
