import { useState } from 'react';
import TaskForm from './TaskForm';

// Due dates are stored as UTC midnight, so format in UTC to avoid off-by-one days
const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'completed') return false;
  const todayUtc = new Date().toISOString().slice(0, 10);
  return task.dueDate.slice(0, 10) < todayUtc;
};

const TaskItem = ({ task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false); // toggle/delete in progress
  const [error, setError] = useState('');

  const isCompleted = task.status === 'completed';

  // Runs an action with per-item loading + error state
  const runAction = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  const handleToggle = () =>
    runAction(() => onUpdate(task._id, { status: isCompleted ? 'pending' : 'completed' }));

  const handleDelete = () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    // On success the parent removes this item, so we don't touch state afterwards
    setBusy(true);
    setError('');
    onDelete(task._id).catch((err) => {
      setError(err.message);
      setBusy(false);
    });
  };

  const handleEditSubmit = async (updates) => {
    await onUpdate(task._id, updates);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="task card">
        <TaskForm initialTask={task} onSubmit={handleEditSubmit} onCancel={() => setIsEditing(false)} />
      </li>
    );
  }

  return (
    <li className={`task card ${isCompleted ? 'task--completed' : ''}`}>
      <div className="task__main">
        <input
          type="checkbox"
          className="task__check"
          checked={isCompleted}
          onChange={handleToggle}
          disabled={busy}
          aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
        />
        <div className="task__body">
          <h3 className="task__title">{task.title}</h3>
          {task.description && <p className="task__description">{task.description}</p>}
          <div className="task__meta">
            <span className={`badge badge--${task.priority}`}>{task.priority}</span>
            <span className={`badge ${isCompleted ? 'badge--done' : 'badge--pending'}`}>
              {isCompleted ? 'Completed' : 'Pending'}
            </span>
            {task.dueDate && (
              <span className={`task__due ${isOverdue(task) ? 'task__due--overdue' : ''}`}>
                {isOverdue(task) ? 'Overdue · ' : 'Due '}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="task__actions">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setIsEditing(true)} disabled={busy}>
          Edit
        </button>
        <button type="button" className="btn btn--danger btn--small" onClick={handleDelete} disabled={busy}>
          {busy ? '...' : 'Delete'}
        </button>
      </div>

      {error && (
        <p className="form-error task__error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
};

export default TaskItem;
