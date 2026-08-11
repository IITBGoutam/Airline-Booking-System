'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsToMany(models.User, {
        through: 'User_Roles',
        as: 'users',
        foreignKey: 'roleId',
        otherKey: 'userId',
      });
    }
  }
  Role.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // e.g. ADMIN, CUSTOMER, FLIGHT_COMPANY
      },
    },
    {
      sequelize,
      modelName: 'Role',
    }
  );
  return Role;
};
