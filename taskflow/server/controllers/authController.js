import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// Same response shape for signup and login. toJSON() strips the password.
const sendAuthResponse = (res, statusCode, user, message) => {
  res.status(statusCode).json({
    success: true,
    data: { user, token: signToken(user._id) },
    message,
  });
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  // Friendly early check; the unique index still guards against race conditions (-> 409)
  const existing = await User.exists({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password });
  sendAuthResponse(res, 201, user, 'Account created successfully');
};

// POST /api/auth/login
export const login = async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  // Same message for "no user" and "wrong password" so attackers can't probe which emails exist
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  sendAuthResponse(res, 200, user, 'Logged in successfully');
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
    message: 'Current user fetched',
  });
};
