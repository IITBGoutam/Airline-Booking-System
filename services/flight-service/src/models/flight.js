'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Flight extends Model {
    static associate(models) {
      Flight.belongsTo(models.Airplane, { foreignKey: 'airplaneId', as: 'airplane' });
      Flight.belongsTo(models.Airport, { foreignKey: 'departureAirportId', as: 'departureAirport' });
      Flight.belongsTo(models.Airport, { foreignKey: 'arrivalAirportId', as: 'arrivalAirport' });
    }
  }
  Flight.init(
    {
      flightNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      airplaneId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      departureAirportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      arrivalAirportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      departureTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      arrivalTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      boardingGate: {
        type: DataTypes.STRING,
      },
      totalSeats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 }, // remaining seats; never allowed to go negative
      },
    },
    {
      sequelize,
      modelName: 'Flight',
    }
  );
  return Flight;
};
