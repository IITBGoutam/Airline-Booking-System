'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('Cities', [
      { name: 'Mumbai', createdAt: now, updatedAt: now },
      { name: 'Delhi', createdAt: now, updatedAt: now },
      { name: 'Bangalore', createdAt: now, updatedAt: now },
    ]);
    const cities = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Cities";',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const cityId = (name) => cities.find((c) => c.name === name).id;

    await queryInterface.bulkInsert('Airports', [
      { name: 'Chhatrapati Shivaji', code: 'BOM', address: 'Mumbai', cityId: cityId('Mumbai'), createdAt: now, updatedAt: now },
      { name: 'Indira Gandhi Intl', code: 'DEL', address: 'Delhi', cityId: cityId('Delhi'), createdAt: now, updatedAt: now },
      { name: 'Kempegowda Intl', code: 'BLR', address: 'Bangalore', cityId: cityId('Bangalore'), createdAt: now, updatedAt: now },
    ]);
    const airports = await queryInterface.sequelize.query(
      'SELECT id, code FROM "Airports";',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const airportId = (code) => airports.find((a) => a.code === code).id;

    await queryInterface.bulkInsert('Airplanes', [
      { modelNumber: 'Airbus A320', capacity: 180, createdAt: now, updatedAt: now },
      { modelNumber: 'Boeing 737', capacity: 160, createdAt: now, updatedAt: now },
    ]);
    const airplanes = await queryInterface.sequelize.query(
      'SELECT id FROM "Airplanes" ORDER BY id;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('Flights', [
      {
        flightNumber: 'AI-101',
        airplaneId: airplanes[0].id,
        departureAirportId: airportId('BOM'),
        arrivalAirportId: airportId('DEL'),
        departureTime: new Date(now.getTime() + 86400000),
        arrivalTime: new Date(now.getTime() + 86400000 + 7200000),
        price: 5500,
        boardingGate: 'A1',
        // Deliberately small so the k6 concurrency test can prove no oversell.
        totalSeats: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        flightNumber: 'AI-202',
        airplaneId: airplanes[1].id,
        departureAirportId: airportId('DEL'),
        arrivalAirportId: airportId('BLR'),
        departureTime: new Date(now.getTime() + 172800000),
        arrivalTime: new Date(now.getTime() + 172800000 + 9000000),
        price: 6200,
        boardingGate: 'B4',
        totalSeats: 200,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Flights', null, {});
    await queryInterface.bulkDelete('Airplanes', null, {});
    await queryInterface.bulkDelete('Airports', null, {});
    await queryInterface.bulkDelete('Cities', null, {});
  },
};
