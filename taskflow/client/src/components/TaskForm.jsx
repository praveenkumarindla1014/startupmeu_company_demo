import { useState } from 'react';

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;

const EMPTY_FORM = { title: '', description: '', priority: 'medium', dueDate: '' };

// API dates are ISO strings; <input type="date"> needs "YYYY-MM-DD"
const toDateInput = (isoDate) => (isoDate ? isoDate.slice(0, 10) : '');

const validateTask = ({ title, description }) => {
  if (!title.trim()) return 'Title is required';
  if (title.trim().length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters`;
  if (description.trim().length > DESCRIPTION_MAX) {
    return `Description must be at most ${DESCRIPTION_MAX} characters`;
  }
  return '';
};

/**
 * Used both to create a task (no initialTask) and to edit one.
 * `onSubmit` must return a promise; errors it throws are shown in the form.
 */
const TaskForm = ({ initialTask, onSubmit, onCancel }) => {
  const isEdit = Boolean(initialTask);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: initialTask.title,
          description: initialTask.description ?? '',
          priority: initialTask.priority,
          dueDate: toDateInput(initialTask.dueDate),
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateTask(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      if (!isEdit) setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    // In edit mode the parent unmounts this form on success, so only reset state when still mounted
    if (!isEdit) setSubmitting(false);
  };

  const idPrefix = isEdit ? `edit-${initialTask._id}` : 'new';

  return (
    <form className={`task-form ${isEdit ? 'task-form--edit' : 'card'}`} onSubmit={handleSubmit} noValidate>
      {!isEdit && <h2 className="task-form__heading">Add a task</h2>}

      <div className="field">
        <label htmlFor={`${idPrefix}-title`}>Title *</label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="What needs to be done?"
          maxLength={TITLE_MAX}
          disabled={submitting}
          autoFocus={isEdit}
        />
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Optional details"
          rows={2}
          maxLength={DESCRIPTION_MAX}
          disabled={submitting}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${idPrefix}-priority`}>Priority</label>
          <select
            id={`${idPrefix}-priority`}
            name="priority"
            value={form.priority}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-dueDate`}>Due date</label>
          <input
            id={`${idPrefix}-dueDate`}
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
