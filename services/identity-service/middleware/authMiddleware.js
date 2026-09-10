import prisma from '../config/prisma.js';
import { verifyToken } from '../services/tokenService.js';
import { AppError } from './errorHandler.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!req.user) {
        return next(new AppError('Not authorized, user not found', 401));
      }

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
    if (!roles.includes(req.user?.role)) {
      return next(new AppError(`User role ${req.user?.role} is not authorized`, 403));
    }
    next();
  };
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new AppError('Not authorized as an admin', 403));
  }
};
