const { StatusCodes } = require('http-status-codes');

const { Booking } = require('../models');
const { AppError, ValidationError } = require('../utils/errors');

class BookingRepository {
  async create(data, transaction) {
    try {
      const booking = await Booking.create(data, { transaction });
      return booking;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error);
      }
      throw new AppError(
        'RepositoryError',
        'Cannot create Booking',
        'There was an issue creating the booking, please try again later',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async get(bookingId, transaction) {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      throw new AppError(
        'NotFound',
        'Booking not found',
        `No booking exists with id ${bookingId}`,
        StatusCodes.NOT_FOUND
      );
    }
    return booking;
  }

  async update(bookingId, data, transaction) {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      throw new AppError(
        'NotFound',
        'Booking not found',
        `No booking exists with id ${bookingId}`,
        StatusCodes.NOT_FOUND
      );
    }
    if (data.status) booking.status = data.status;
    if (data.totalCost !== undefined) booking.totalCost = data.totalCost;
    await booking.save({ transaction });
    return booking;
  }
}

module.exports = BookingRepository;
