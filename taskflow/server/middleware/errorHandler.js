import AppError from '../utils/AppError.js';

// Catch-all for routes that don't exist. Must be registered after all routes.
export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Translates known library errors into AppErrors so the client always
 * receives a meaningful status code and message.
 */
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  // Invalid ObjectId that slipped past validation
  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError(messages.join('. '), 400);
  }

  // Unique index violation, e.g. two signups with the same email at the same time
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return new AppError(`An account with this ${field} already exists`, 409);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Your session has expired. Please log in again.', 401);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return new AppError('Invalid authentication token. Please log in again.', 401);
  }

  // Malformed JSON body or body too large (thrown by express.json)
  if (err.type === 'entity.parse.failed') {
    return new AppError('Request body contains invalid JSON', 400);
  }
  if (err.type === 'entity.too.large') {
    return new AppError('Request body is too large', 413);
  }

  return null; // unknown -> treated as 500
};

// Express recognises error middleware by its 4 arguments
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const appError = normalizeError(err);
  const isDev = process.env.NODE_ENV !== 'production';

  if (!appError) {
    // Unexpected bug: log full details server-side, hide them from the client
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong on our end. Please try again later.',
      ...(isDev && { stack: err.stack }),
    });
  }

  res.status(appError.statusCode).json({
    success: false,
    data: null,
    message: appError.message,
  });
};
