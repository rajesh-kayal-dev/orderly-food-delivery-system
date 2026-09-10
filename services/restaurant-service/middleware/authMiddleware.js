import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';
import { AppError } from './errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicKeyPath = path.join(__dirname, '../certs/public.key');

let publicKey = null;
try {
  if (fs.existsSync(publicKeyPath)) {
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  }
} catch (error) {
  console.warn('[Restaurant Service] Public key failed to load:', error.message);
}

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = publicKey
        ? jwt.verify(token, publicKey, { algorithms: ['RS256'] })
        : jwt.verify(token, env.jwtSecret);

      req.user = decoded;
      next();
    } catch (error) {
      return next(new AppError('Not authorized, token failed', 401));
    }
  } else {
    return next(new AppError('Not authorized, no token', 401));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(`User role ${req.user?.role || 'Unknown'} is not authorized`, 403));
    }
    next();
  };
};
