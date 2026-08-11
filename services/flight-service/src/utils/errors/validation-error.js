const { StatusCodes } = require('http-status-codes');
const AppError = require('./app-error');

class ValidationError extends AppError {
  constructor(error) {
    const explanation = [];
    (error.errors || []).forEach((err) => explanation.push(err.message));
    super(
      'ValidationError',
      'Not able to validate the request',
      explanation.length ? explanation : error.message,
      StatusCodes.BAD_REQUEST
    );
  }
}

module.exports = ValidationError;
