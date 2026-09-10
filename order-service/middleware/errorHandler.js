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
    } else if (message.includes('required') || message.includes('empty') || message.includes('Cannot cancel') || message.includes('already exists') || message.includes('Maximum quantity')) {
      statusCode = 400;
    } else if (message.includes('unauthorized') || message.includes('Unauthorized') || message.includes('Not authorized')) {
      statusCode = 401;
    } else if (message.includes('forbidden') || message.includes('not authorized')) {
      statusCode = 403;
    }
  }

  if (statusCode >= 500) {
    console.error(`[Order Service Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
