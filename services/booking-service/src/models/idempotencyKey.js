'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IdempotencyKey extends Model {
    static associate(models) {
      IdempotencyKey.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'booking',
      });
    }
  }
  IdempotencyKey.init(
    {
      idempotencyKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // the guarantee that the same key can never create two bookings
      },
      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null while the request is still in flight
      },
    },
    {
      sequelize,
      modelName: 'IdempotencyKey',
    }
  );
  return IdempotencyKey;
};
