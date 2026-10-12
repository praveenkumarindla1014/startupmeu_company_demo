import mongoose from 'mongoose';

export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const TASK_STATUSES = ['pending', 'completed'];

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    priority: {
      type: String,
      enum: { values: TASK_PRIORITIES, message: 'Priority must be low, medium or high' },
      default: 'medium',
    },
    status: {
      type: String,
      enum: { values: TASK_STATUSES, message: 'Status must be pending or completed' },
      default: 'pending',
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Supports the main query: "my tasks, optionally by status, newest first"
taskSchema.index({ user: 1, status: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
