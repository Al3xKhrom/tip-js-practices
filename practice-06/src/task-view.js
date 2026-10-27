const PRIORITY_LABELS = Object.freeze({ low: 'Низкий', medium: 'Средний', high: 'Высокий' });

export function createTaskElement(task, category) {
  const li = document.createElement('li');
  li.className = 'task-card';
  li.dataset.taskId = String(task.id);
  li.classList.toggle('is-completed', task.completed);
  const heading = document.createElement('h3');
  heading.className = 'task-title';
  heading.textContent = task.title;
  const details = document.createElement('div');
  details.className = 'task-meta';
  const status = document.createElement('span');
  status.className = 'task-status';
  status.textContent = task.completed ? 'Выполнена' : 'В работе';
  const priority = document.createElement('span');
  priority.className = 'task-priority';
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;
  const categoryLabel = document.createElement('span');
  categoryLabel.className = 'task-category';
  categoryLabel.textContent = category?.name ?? 'Неизвестная категория';
  details.append(status, priority, categoryLabel);
  const actions = document.createElement('div');
  actions.className = 'task-actions';
  const captions = {
    toggle: task.completed ? 'Вернуть в работу' : 'Выполнить',
    edit: 'Изменить', delete: 'Удалить'
  };
  for (const [action, caption] of Object.entries(captions)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    if (action === 'toggle') button.setAttribute('aria-pressed', String(task.completed));
    const label = document.createElement('span');
    label.className = 'action-label';
    label.textContent = caption;
    button.append(label);
    actions.append(button);
  }
  li.append(heading, details, actions);
  return li;
}

export function renderTaskList(list, tasks, categories) {
  const lookup = new Map(categories.map(category => [category.id, category]));
  list.replaceChildren(...tasks.map(task => createTaskElement(task, lookup.get(task.categoryId))));
}