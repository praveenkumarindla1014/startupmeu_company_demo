/**
 * Custom error for expected ("operational") failures such as bad input,
 * missing resources or auth problems. The central error handler trusts
 * these and sends their message to the client as-is.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export default AppError;
