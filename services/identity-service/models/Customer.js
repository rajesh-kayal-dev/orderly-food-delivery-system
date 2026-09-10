import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false,
  },
  default_address_id: {
    type: DataTypes.UUID,
  }
}, {
  tableName: 'customer',
  createdAt: 'created_at',
  updatedAt: false,
  paranoid: true,
  deletedAt: 'deleted_at',
});

export default Customer;
