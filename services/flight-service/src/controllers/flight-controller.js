const { StatusCodes } = require('http-status-codes');

const { FlightService } = require('../services');

const flightService = new FlightService();

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

class FlightController {
  async create(req, res) {
    try {
      const flight = await flightService.createFlight(req.body);
      return successResponse(res, flight, 'Successfully created the flight', StatusCodes.CREATED);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getAll(req, res) {
    try {
      const flights = await flightService.getFlights(req.query);
      return successResponse(res, flights, 'Successfully fetched the flights');
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async get(req, res) {
    try {
      const flight = await flightService.getFlight(req.params.id);
      return successResponse(res, flight, 'Successfully fetched the flight');
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async updateSeats(req, res) {
    try {
      const { seats, dec } = req.body;
      const decrement = dec === undefined ? true : Boolean(dec);
      const flight = await flightService.updateSeats(req.params.id, seats, decrement);
      return successResponse(res, flight, 'Successfully updated the seats');
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

module.exports = new FlightController();
