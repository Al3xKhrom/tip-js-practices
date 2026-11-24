const priorityLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li className={`task-card${task.completed ? ' task-card-done' : ''}`}>
      <div className="task-card-top">
        <div className="task-title-wrap">
          <span className="task-id">#{task.id}</span>
          <h3 className="task-title">{task.title}</h3>
        </div>
        <span className={`status-chip ${task.completed ? 'status-done' : 'status-active'}`}>
          {task.completed ? 'Выполнена' : 'В работе'}
        </span>
      </div>
      <div className="task-metadata">
        <span className={`priority-chip priority-${task.priority}`}>{priorityLabels[task.priority] ?? task.priority}</span>
        <span className="category-chip">{categoryName}</span>
      </div>
      <div className="task-actions">
        <button className="button button-secondary" type="button" onClick={() => onToggle(task.id)}>
          {task.completed ? 'Вернуть в работу' : 'Выполнить'}
        </button>
        <button className="button button-ghost" type="button" onClick={() => onEdit(task.id)}>Редактировать</button>
        <button className="button button-danger" type="button" onClick={() => onDelete(task.id)}>Удалить</button>
      </div>
    </li>
  );
}
