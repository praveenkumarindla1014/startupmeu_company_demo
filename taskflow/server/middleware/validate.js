import AppError from '../utils/AppError.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/Task.js';

/*
 * Lightweight request validation (no extra library needed for this scope).
 * Each rule function receives the request body and returns an array of
 * error messages. An empty array means the input is valid.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidDateOrEmpty = (value) =>
  value === null || value === '' || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));

// Wraps a rule function into Express middleware
const validate = (rules) => (req, _res, next) => {
  const errors = rules(req.body ?? {});
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  next();
};

const signupRules = ({ name, email, password }) => {
  const errors = [];
  if (!isNonEmptyString(name)) errors.push('Name is required');
  else if (name.trim().length > 50) errors.push('Name must be at most 50 characters');

  if (!isNonEmptyString(email)) errors.push('Email is required');
  else if (!EMAIL_REGEX.test(email.trim())) errors.push('Please provide a valid email address');

  if (typeof password !== 'string' || password.length === 0) errors.push('Password is required');
  else if (password.length < 6) errors.push('Password must be at least 6 characters');
  return errors;
};

const loginRules = ({ email, password }) => {
  const errors = [];
  if (!isNonEmptyString(email)) errors.push('Email is required');
  else if (!EMAIL_REGEX.test(email.trim())) errors.push('Please provide a valid email address');

  if (typeof password !== 'string' || password.length === 0) errors.push('Password is required');
  return errors;
};

// Shared checks for optional task fields (used by both create and update)
const optionalTaskFieldRules = ({ description, priority, status, dueDate }) => {
  const errors = [];
  if (description !== undefined) {
    if (typeof description !== 'string') errors.push('Description must be text');
    else if (description.trim().length > 500) errors.push('Description must be at most 500 characters');
  }
  if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) {
    errors.push('Priority must be low, medium or high');
  }
  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    errors.push('Status must be pending or completed');
  }
  if (dueDate !== undefined && !isValidDateOrEmpty(dueDate)) {
    errors.push('Due date must be a valid date');
  }
  return errors;
};

const validateTitle = (title) => {
  if (!isNonEmptyString(title)) return ['Title is required'];
  if (title.trim().length > 100) return ['Title must be at most 100 characters'];
  return [];
};

const createTaskRules = (body) => [...validateTitle(body.title), ...optionalTaskFieldRules(body)];

const UPDATABLE_FIELDS = ['title', 'description', 'priority', 'status', 'dueDate'];

const updateTaskRules = (body) => {
  const hasUpdatableField = UPDATABLE_FIELDS.some((field) => body[field] !== undefined);
  if (!hasUpdatableField) return ['Provide at least one field to update'];

  const errors = [];
  if (body.title !== undefined) errors.push(...validateTitle(body.title));
  errors.push(...optionalTaskFieldRules(body));
  return errors;
};

export const validateSignup = validate(signupRules);
export const validateLogin = validate(loginRules);
export const validateCreateTask = validate(createTaskRules);
export const validateUpdateTask = validate(updateTaskRules);

// Rejects malformed ids before they reach Mongoose (which would throw a CastError)
export const validateObjectId = (req, _res, next) => {
  if (!OBJECT_ID_REGEX.test(req.params.id)) {
    return next(new AppError('Invalid task ID', 400));
  }
  next();
};

// Only allow ?status=pending|completed (or no filter at all)
export const validateStatusQuery = (req, _res, next) => {
  const { status } = req.query;
  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    return next(new AppError('Status filter must be pending or completed', 400));
  }
  next();
};
