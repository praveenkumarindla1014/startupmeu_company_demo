import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Protects routes: requires "Authorization: Bearer <token>".
 * jwt.verify throws TokenExpiredError / JsonWebTokenError, which the
 * central error handler converts into 401 responses.
 */
export const protect = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Not authenticated. Please log in.', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // The user may have been deleted after the token was issued
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('The account for this token no longer exists.', 401);
  }

  req.user = user;
  next();
};
