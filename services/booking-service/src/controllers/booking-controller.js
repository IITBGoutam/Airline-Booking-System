const { StatusCodes } = require('http-status-codes');

const { BookingService } = require('../services');
const { AppError } = require('../utils/errors');

const bookingService = new BookingService();

function successResponse(res, data, message = 'Successfully processed the request', code = StatusCodes.OK) {
  return res.status(code).json({ success: true, message, err: {}, data });
}

function errorResponse(res, error) {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  return res.status(statusCode).json({
    success: false,
    message: error.message,
    err: error.explanation || error.message,
    data: {},
  });
}

class BookingController {
  async create(req, res) {
    try {
      const idempotencyKey = req.headers['x-idempotency-key'];
      const response = await bookingService.createBooking({
        flightId: req.body.flightId,
        userId: req.body.userId,
        noOfSeats: req.body.noOfSeats,
        idempotencyKey,
      });
      return successResponse(res, response, 'Successfully completed the booking', StatusCodes.CREATED);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async get(req, res) {
    try {
      const response = await bookingService.getBooking(req.params.id);
      return successResponse(res, response, 'Successfully fetched the booking');
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async cancel(req, res) {
    try {
      const response = await bookingService.cancelBooking(req.params.id);
      return successResponse(res, response, 'Successfully cancelled the booking');
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

module.exports = new BookingController();
