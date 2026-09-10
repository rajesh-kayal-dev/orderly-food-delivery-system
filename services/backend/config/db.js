import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'neondb',
      process.env.DB_USER || 'neondb_owner',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
      }
    );

export default sequelize;

