export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Map standard error messages to appropriate status codes if not already an AppError
  if (!err.statusCode) {
    if (message.includes('already registered') || message.includes('already exists')) {
      statusCode = 400;
    } else if (message.includes('Invalid credentials') || message.includes('Invalid email or password')) {
      statusCode = 401;
    } else if (message.includes('pending admin approval') || message.includes('deactivated') || message.includes('Not authorized')) {
      statusCode = 403;
    } else if (message.includes('not found')) {
      statusCode = 404;
    }
  }

  if (statusCode >= 500) {
    console.error(`[Identity Service Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
