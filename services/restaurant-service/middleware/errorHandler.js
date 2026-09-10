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

  if (!err.statusCode) {
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('already exists') || message.includes('required')) {
      statusCode = 400;
    } else if (message.includes('unauthorized') || message.includes('Not authorized')) {
      statusCode = 401;
    } else if (message.includes('not authorized') || message.includes('forbidden')) {
      statusCode = 403;
    }
  }

  if (statusCode >= 500) {
    console.error(`[Restaurant Service Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
