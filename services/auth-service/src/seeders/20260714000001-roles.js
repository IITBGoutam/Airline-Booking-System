'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Roles', [
      { name: 'ADMIN', createdAt: now, updatedAt: now },
      { name: 'CUSTOMER', createdAt: now, updatedAt: now },
      { name: 'FLIGHT_COMPANY', createdAt: now, updatedAt: now },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Roles', null, {});
  },
};
