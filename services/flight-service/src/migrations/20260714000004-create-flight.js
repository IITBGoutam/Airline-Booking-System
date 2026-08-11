'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Flights', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      flightNumber: { type: Sequelize.STRING, allowNull: false },
      airplaneId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Airplanes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      departureAirportId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Airports', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      arrivalAirportId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Airports', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      departureTime: { type: Sequelize.DATE, allowNull: false },
      arrivalTime: { type: Sequelize.DATE, allowNull: false },
      price: { type: Sequelize.INTEGER, allowNull: false },
      boardingGate: { type: Sequelize.STRING },
      totalSeats: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Flights');
  },
};
