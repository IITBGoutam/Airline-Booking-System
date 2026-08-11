'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Airport extends Model {
    static associate(models) {
      Airport.belongsTo(models.City, { foreignKey: 'cityId', as: 'city' });
      Airport.hasMany(models.Flight, { foreignKey: 'departureAirportId', as: 'departingFlights' });
      Airport.hasMany(models.Flight, { foreignKey: 'arrivalAirportId', as: 'arrivingFlights' });
    }
  }
  Airport.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // IATA-style code, e.g. BOM, DEL
      },
      address: {
        type: DataTypes.STRING,
      },
      cityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Airport',
    }
  );
  return Airport;
};
