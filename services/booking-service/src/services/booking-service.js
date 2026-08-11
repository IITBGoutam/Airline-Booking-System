const axios = require('axios');
const { StatusCodes } = require('http-status-codes');

const db = require('../models');
const { BookingRepository } = require('../repository');
const { FLIGHT_SERVICE_PATH, BOOKING_TOPIC } = require('../config');
const { AppError } = require('../utils/errors');
const { publish } = require('../utils/kafka/producer');

const { Booking, IdempotencyKey } = db;

class BookingService {
  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  /**
   * Create a booking.
   *
   * Guarantees:
   *  - Idempotent: two requests carrying the same `idempotencyKey` produce at
   *    most one booking (enforced by a unique key + row lock).
   *  - Atomic: the booking row + idempotency record are written in a single
   *    DB transaction.
   *  - No double booking: seats are decremented in the Flight service under a
   *    row-level lock (SELECT ... FOR UPDATE). If our transaction then fails we
   *    compensate by releasing the seats (saga-style rollback).
   */
  async createBooking(data) {
    const { idempotencyKey } = data;
    if (!idempotencyKey) {
      throw new AppError(
        'BadRequest',
        'Idempotency key missing',
        'Provide an `x-idempotency-key` header to make this booking safe to retry',
        StatusCodes.BAD_REQUEST
      );
    }

    // Fast path: this key was already fully processed -> replay the same result.
    const settled = await IdempotencyKey.findOne({ where: { idempotencyKey } });
    if (settled && settled.bookingId) {
      return this.bookingRepository.get(settled.bookingId);
    }

    let seatsDecremented = false;
    const transaction = await db.sequelize.transaction();
    try {
      // Reserve the idempotency key. The unique constraint is the real
      // guarantee: a concurrent duplicate blocks on the unique index at INSERT
      // time until this transaction commits, then loses the race and is routed
      // to the already-created booking below (created === false).
      const [record, created] = await IdempotencyKey.findOrCreate({
        where: { idempotencyKey },
        defaults: { idempotencyKey },
        transaction,
      });

      if (!created && record.bookingId) {
        await transaction.commit();
        return this.bookingRepository.get(record.bookingId);
      }

      // 1. Fetch the flight from the Flight service (cross-service association).
      const flightResp = await axios.get(
        `${FLIGHT_SERVICE_PATH}/api/v1/flights/${data.flightId}`
      );
      const flight = flightResp.data.data;
      if (data.noOfSeats > flight.totalSeats) {
        throw new AppError(
          'InsufficientSeats',
          'Cannot complete booking',
          `Only ${flight.totalSeats} seats remain on flight ${data.flightId}`,
          StatusCodes.BAD_REQUEST
        );
      }
      const totalCost = flight.price * data.noOfSeats;

      // 2. Persist the booking (InProcess) inside our transaction.
      const booking = await this.bookingRepository.create(
        {
          flightId: data.flightId,
          userId: data.userId,
          noOfSeats: data.noOfSeats,
          totalCost,
          status: 'InProcess',
        },
        transaction
      );

      // 3. Decrement seats in the Flight service. The Flight service performs
      //    the actual SELECT ... FOR UPDATE row lock, so parallel bookings for
      //    the same flight are serialized there and cannot oversell.
      await axios.patch(
        `${FLIGHT_SERVICE_PATH}/api/v1/flights/${data.flightId}/seats`,
        { seats: data.noOfSeats, dec: true }
      );
      seatsDecremented = true;

      // 4. Finalize the booking and bind it to the idempotency key.
      await this.bookingRepository.update(booking.id, { status: 'Booked' }, transaction);
      record.bookingId = booking.id;
      await record.save({ transaction });

      await transaction.commit();

      // 5. Emit the event AFTER commit (async notifications + eventual consistency).
      await publish(BOOKING_TOPIC, {
        event: 'BOOKING_CREATED',
        key: booking.id,
        data: {
          bookingId: booking.id,
          flightId: booking.flightId,
          userId: booking.userId,
          noOfSeats: booking.noOfSeats,
          totalCost,
        },
        occurredAt: new Date().toISOString(),
      });

      return this.bookingRepository.get(booking.id);
    } catch (error) {
      await transaction.rollback();
      // Compensating action: if we already took seats but failed to commit,
      // give them back so the two services converge (eventual consistency).
      if (seatsDecremented) {
        try {
          await axios.patch(
            `${FLIGHT_SERVICE_PATH}/api/v1/flights/${data.flightId}/seats`,
            { seats: data.noOfSeats, dec: false }
          );
        } catch (compensateErr) {
          console.error('[booking] failed to compensate seats:', compensateErr.message);
        }
      }
      if (error instanceof AppError) throw error;
      if (error.response) {
        throw new AppError(
          'FlightServiceError',
          'Booking failed',
          error.response.data?.err || error.response.data?.message || 'Flight service rejected the request',
          error.response.status || StatusCodes.BAD_GATEWAY
        );
      }
      throw new AppError(
        'BookingError',
        'Booking failed',
        error.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getBooking(bookingId) {
    return this.bookingRepository.get(bookingId);
  }

  /** Cancel a booking and release its seats back to the flight. */
  async cancelBooking(bookingId) {
    const transaction = await db.sequelize.transaction();
    try {
      const booking = await this.bookingRepository.get(bookingId, transaction);
      if (booking.status === 'Cancelled') {
        await transaction.commit();
        return booking;
      }
      await this.bookingRepository.update(bookingId, { status: 'Cancelled' }, transaction);
      await axios.patch(
        `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}/seats`,
        { seats: booking.noOfSeats, dec: false }
      );
      await transaction.commit();

      await publish(BOOKING_TOPIC, {
        event: 'BOOKING_CANCELLED',
        key: booking.id,
        data: { bookingId: booking.id, flightId: booking.flightId, userId: booking.userId },
        occurredAt: new Date().toISOString(),
      });
      return this.bookingRepository.get(bookingId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('BookingError', 'Cancel failed', error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = BookingService;
