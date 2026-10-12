import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

// Does this task belong in the list for the active filter?
const matchesFilter = (task, filter) => filter === 'all' || task.status === filter;

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async (activeFilter, signal) => {
    setLoading(true);
    setError('');
    try {
      const params = activeFilter === 'all' ? {} : { status: activeFilter };
      const { data } = await api.get('/tasks', { params, signal });
      setTasks(data);
      setLoading(false);
    } catch (err) {
      if (err.cancelled) return; // a newer request replaced this one
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Refetch whenever the filter changes; abort the previous request to avoid race conditions
  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(filter, controller.signal);
    return () => controller.abort();
  }, [filter, fetchTasks]);

  const handleCreate = async (newTask) => {
    const { data: created } = await api.post('/tasks', newTask);
    if (matchesFilter(created, filter)) {
      setTasks((prev) => [created, ...prev]);
    }
  };

  const handleUpdate = async (id, updates) => {
    const { data: updated } = await api.put(`/tasks/${id}`, updates);
    setTasks((prev) =>
      matchesFilter(updated, filter)
        ? prev.map((t) => (t._id === id ? updated : t))
        : prev.filter((t) => t._id !== id) // e.g. completed a task while viewing "Pending"
    );
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <main className="container dashboard">
      <TaskForm onSubmit={handleCreate} />

      <section className="tasks-section">
        <div className="tasks-header">
          <h2>My tasks</h2>
          <div className="filters" role="group" aria-label="Filter tasks by status">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`filter-btn ${filter === value ? 'filter-btn--active' : ''}`}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loader text="Loading tasks..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchTasks(filter)} />
        ) : (
          <TaskList tasks={tasks} filter={filter} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </section>
    </main>
  );
};

export default Dashboard;
