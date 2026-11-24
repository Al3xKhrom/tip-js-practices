import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete, totalCount, sortMode, onSortChange }) {
  return (
    <section className="panel list-panel" aria-label="Список задач">
      <div className="panel-heading list-heading">
        <div><span className="eyebrow">Список задач</span><h2>Найдено: {tasks.length}</h2></div>
        <div className="field sort-field">
          <label htmlFor="sort-tasks">Сортировать</label>
          <select id="sort-tasks" value={sortMode} onChange={event => onSortChange(event.target.value)}>
            <option value="default">Исходный порядок</option>
            <option value="title">По названию (А–Я)</option>
            <option value="priority">По приоритету (сначала высокий)</option>
          </select>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="empty-state" role="status">
          <strong>{totalCount === 0 ? 'Список пока пуст' : 'Ничего не найдено'}</strong>
          <p>{totalCount === 0 ? 'Добавьте первую задачу через форму.' : 'Попробуйте изменить поиск или сбросить фильтры.'}</p>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task}
              categoryName={categories.find(category => category.id === task.categoryId)?.name ?? 'Без категории'}
              onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
