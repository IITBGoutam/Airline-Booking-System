const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const db = require('../models');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const { AppError } = require('../utils/errors');

const { User, Role } = db;

class AuthService {
  async signup({ email, password }) {
    try {
      const user = await User.create({ email, password });
      // Every new user is a CUSTOMER by default.
      const customerRole = await Role.findOne({ where: { name: 'CUSTOMER' } });
      if (customerRole) await user.addRole(customerRole);
      return { id: user.id, email: user.email };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Conflict', 'Email already registered', 'A user with this email already exists', StatusCodes.CONFLICT);
      }
      if (error.name === 'SequelizeValidationError') {
        throw new AppError('ValidationError', 'Invalid input', error.errors.map((e) => e.message), StatusCodes.BAD_REQUEST);
      }
      throw new AppError('AuthError', 'Signup failed', error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async signin({ email, password }) {
    const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'roles' }] });
    if (!user || !user.comparePassword(password)) {
      throw new AppError('Unauthorized', 'Invalid credentials', 'Email or password is incorrect', StatusCodes.UNAUTHORIZED);
    }
    const roles = user.roles.map((r) => r.name);
    const token = jwt.sign({ id: user.id, email: user.email, roles }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return { token, user: { id: user.id, email: user.email, roles } };
  }

  verifyToken(token) {
    if (!token) {
      throw new AppError('Unauthorized', 'Missing token', 'No token provided', StatusCodes.UNAUTHORIZED);
    }
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new AppError('Unauthorized', 'Invalid token', err.message, StatusCodes.UNAUTHORIZED);
    }
  }

  async isAdmin(userId) {
    const user = await User.findByPk(userId, { include: [{ model: Role, as: 'roles' }] });
    if (!user) return false;
    return user.roles.some((r) => r.name === 'ADMIN');
  }
}

module.exports = AuthService;
