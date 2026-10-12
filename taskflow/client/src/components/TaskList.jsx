import TaskItem from './TaskItem';

const EMPTY_MESSAGES = {
  all: 'No tasks yet. Add your first task above!',
  pending: 'No pending tasks. Nice work!',
  completed: 'No completed tasks yet.',
};

const TaskList = ({ tasks, filter, onUpdate, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="empty-state card">
        <p>{EMPTY_MESSAGES[filter]}</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  );
};

export default TaskList;
