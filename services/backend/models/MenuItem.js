import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  restaurant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.UUID,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  image_url: {
    type: DataTypes.STRING(500),
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'menu_item',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
});

export default MenuItem;
