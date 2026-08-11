'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { SALT_ROUNDS } = require('../config');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.Role, {
        through: 'User_Roles',
        as: 'roles',
        foreignKey: 'userId',
        otherKey: 'roleId',
      });
    }

    comparePassword(plain) {
      return bcrypt.compareSync(plain, this.password);
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );

  // Hash before insert so plaintext never hits the DB.
  User.beforeCreate((user) => {
    user.password = bcrypt.hashSync(user.password, SALT_ROUNDS);
  });

  return User;
};
