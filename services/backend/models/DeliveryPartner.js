import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DeliveryPartner = sequelize.define('DeliveryPartner', {
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
  vehicle_license: {
    type: DataTypes.STRING(100),
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Scooter / Bike'
  },
  vehicle_name: {
    type: DataTypes.STRING(100),
    defaultValue: 'Honda Activa 6G'
  },
  address: {
    type: DataTypes.TEXT,
  },
  operating_zone: {
    type: DataTypes.STRING(100),
    defaultValue: 'Central City Zone'
  },
  delivery_category: {
    type: DataTypes.STRING(100),
    defaultValue: 'Express Food Delivery'
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
  },
  last_location_update: {
    type: DataTypes.DATE,
  },
  acceptance_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100.00,
  },
  last_idle_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'delivery_partner',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
});

export default DeliveryPartner;
