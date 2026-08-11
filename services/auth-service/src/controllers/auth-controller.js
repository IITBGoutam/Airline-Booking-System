const { StatusCodes } = require('http-status-codes');

const { AuthService } = require('../services');

const authService = new AuthService();

function successResponse(res, data, message, code = StatusCodes.OK) {
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

function extractToken(req) {
  const header = req.headers['authorization'] || req.headers['x-access-token'];
  if (!header) return null;
  return header.startsWith('Bearer ') ? header.slice(7) : header;
}

class AuthController {
  async signup(req, res) {
    try {
      const user = await authService.signup(req.body);
      return successResponse(res, user, 'Successfully registered', StatusCodes.CREATED);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async signin(req, res) {
    try {
      const result = await authService.signin(req.body);
      return successResponse(res, result, 'Successfully signed in');
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async isAuthenticated(req, res) {
    try {
      const payload = authService.verifyToken(extractToken(req));
      return successResponse(res, { userId: payload.id, email: payload.email, roles: payload.roles }, 'Token is valid');
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async isAdmin(req, res) {
    try {
      const payload = authService.verifyToken(extractToken(req));
      const admin = await authService.isAdmin(payload.id);
      return successResponse(res, { userId: payload.id, isAdmin: admin }, 'Checked admin role');
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

module.exports = new AuthController();
