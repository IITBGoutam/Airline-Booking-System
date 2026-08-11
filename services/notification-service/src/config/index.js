require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3003,
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'notification-service',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'notification-group',
  BOOKING_TOPIC: process.env.BOOKING_TOPIC || 'booking-events',
  AVAILABILITY_TOPIC: process.env.AVAILABILITY_TOPIC || 'availability-events',
};
