require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FLIGHT_SERVICE_PATH: process.env.FLIGHT_SERVICE_PATH || 'http://localhost:3000',
  AUTH_SERVICE_PATH: process.env.AUTH_SERVICE_PATH || 'http://localhost:3001',
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'booking-service',
  BOOKING_TOPIC: process.env.BOOKING_TOPIC || 'booking-events',
};
