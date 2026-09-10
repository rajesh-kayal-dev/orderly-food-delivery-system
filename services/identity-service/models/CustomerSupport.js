import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CustomerSupport = sequelize.define('CustomerSupport', {
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
  contact_number: {
    type: DataTypes.STRING(20),
  }
}, {
  tableName: 'customer_support',
  createdAt: 'created_at',
  updatedAt: false,
  paranoid: true,
  deletedAt: 'deleted_at',
});

export default CustomerSupport;
