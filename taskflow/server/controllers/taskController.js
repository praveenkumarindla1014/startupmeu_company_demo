import Task from '../models/Task.js';
import AppError from '../utils/AppError.js';

const UPDATABLE_FIELDS = ['title', 'description', 'priority', 'status', 'dueDate'];

// Copy only whitelisted fields so clients can't set things like `user` (mass assignment)
const pickTaskFields = (body) => {
  const fields = {};
  for (const key of UPDATABLE_FIELDS) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  if (fields.dueDate === '') fields.dueDate = null; // empty date input means "no due date"
  return fields;
};

// Loads a task and verifies the logged-in user owns it
const findOwnedTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  if (!task.user.equals(userId)) {
    throw new AppError('You do not have permission to access this task', 403);
  }
  return task;
};

// GET /api/tasks?status=pending|completed
export const getTasks = async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const tasks = await Task.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: tasks,
    message: `${tasks.length} task(s) found`,
  });
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const task = await Task.create({ ...pickTaskFields(req.body), user: req.user._id });

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created',
  });
};

// PUT /api/tasks/:id  (partial update: only the fields sent are changed)
export const updateTask = async (req, res) => {
  const task = await findOwnedTask(req.params.id, req.user._id);

  task.set(pickTaskFields(req.body));
  await task.save(); // save() runs schema validators

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task updated',
  });
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  const task = await findOwnedTask(req.params.id, req.user._id);
  await task.deleteOne();

  res.status(200).json({
    success: true,
    data: { id: task._id },
    message: 'Task deleted',
  });
};
