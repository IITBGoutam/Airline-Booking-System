const { Op } = require('sequelize');
const { StatusCodes } = require('http-status-codes');

const db = require('../models');
const { AppError, ValidationError } = require('../utils/errors');

const { Flight, Airplane, Airport, City } = db;

const flightIncludes = [
  { model: Airplane, as: 'airplane' },
  { model: Airport, as: 'departureAirport', include: [{ model: City, as: 'city' }] },
  { model: Airport, as: 'arrivalAirport', include: [{ model: City, as: 'city' }] },
];

class FlightRepository {
  async create(data) {
    try {
      return await Flight.create(data);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') throw new ValidationError(error);
      throw new AppError('RepositoryError', 'Cannot create flight', error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(filter = {}) {
    const where = {};
    if (filter.airplaneId) where.airplaneId = filter.airplaneId;
    if (filter.departureAirportId) where.departureAirportId = filter.departureAirportId;
    if (filter.arrivalAirportId) where.arrivalAirportId = filter.arrivalAirportId;
    if (filter.minSeats) where.totalSeats = { [Op.gte]: Number(filter.minSeats) };
    return Flight.findAll({ where, include: flightIncludes });
  }

  async get(id) {
    const flight = await Flight.findByPk(id, { include: flightIncludes });
    if (!flight) {
      throw new AppError('NotFound', 'Flight not found', `No flight with id ${id}`, StatusCodes.NOT_FOUND);
    }
    return flight;
  }

  /**
   * Atomically adjust the remaining seats on a flight.
   *
   * This is the concurrency-control heart of the system. We open a
   * transaction and take a PostgreSQL row-level lock (SELECT ... FOR UPDATE)
   * on the flight row. Any other booking touching the same flight blocks
   * until we commit, so two concurrent bookings can never both read the same
   * "seats available" and oversell it -> no double booking.
   */
  async updateRemainingSeats(flightId, seats, dec = true) {
    const id = Number(flightId);
    const numSeats = Number(seats);
    if (!Number.isInteger(id) || !Number.isInteger(numSeats) || numSeats <= 0) {
      throw new AppError('BadRequest', 'Invalid seat update', 'flightId and seats must be positive integers', StatusCodes.BAD_REQUEST);
    }

    const transaction = await db.sequelize.transaction();
    try {
      // Row-level lock. Parameterized to avoid injection even though these are numbers.
      await db.sequelize.query('SELECT id FROM "Flights" WHERE id = :id FOR UPDATE', {
        replacements: { id },
        transaction,
      });

      const flight = await Flight.findByPk(id, { transaction });
      if (!flight) {
        throw new AppError('NotFound', 'Flight not found', `No flight with id ${id}`, StatusCodes.NOT_FOUND);
      }

      if (dec) {
        if (flight.totalSeats < numSeats) {
          throw new AppError(
            'InsufficientSeats',
            'Not enough seats',
            `Requested ${numSeats} but only ${flight.totalSeats} remain`,
            StatusCodes.BAD_REQUEST
          );
        }
        await flight.decrement('totalSeats', { by: numSeats, transaction });
      } else {
        await flight.increment('totalSeats', { by: numSeats, transaction });
      }

      await transaction.commit();
      return Flight.findByPk(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = FlightRepository;
