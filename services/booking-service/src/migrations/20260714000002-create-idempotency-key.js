'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('IdempotencyKeys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      idempotencyKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('IdempotencyKeys', ['idempotencyKey'], {
      unique: true,
      name: 'idempotency_keys_key_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('IdempotencyKeys');
  },
};
