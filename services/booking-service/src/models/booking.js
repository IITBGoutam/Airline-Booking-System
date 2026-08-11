'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // flightId / userId are cross-service references (Flight service, Auth service).
      // They are validated over HTTP at booking time rather than by a local FK,
      // which is the normal trade-off in a microservice / database-per-service setup.
    }
  }
  Booking.init(
    {
      flightId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('InProcess', 'Booked', 'Cancelled'),
        allowNull: false,
        defaultValue: 'InProcess',
      },
      noOfSeats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      totalCost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Booking',
    }
  );
  return Booking;
};
