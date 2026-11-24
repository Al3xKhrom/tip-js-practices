// Предметный слой ПР7: только чистые функции, без React, DOM и HTTP.
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);

export function validateTaskDraft(draft, categories) {
  const errors = {};
  const source = draft && typeof draft === 'object' ? draft : {};
  const title = typeof source.title === 'string' ? source.title.trim() : '';
  const priority = source.priority;
  const rawCategory = source.categoryId;
  const validCategoryText = typeof rawCategory === 'string' && /^\d+$/.test(rawCategory);
  const validCategoryNumber = typeof rawCategory === 'number' && Number.isSafeInteger(rawCategory);
  const categoryId = validCategoryText || validCategoryNumber ? Number(rawCategory) : NaN;

  if (title.length < 1 || title.length > 100) {
    errors.title = 'Название должно содержать от 1 до 100 символов.';
  }
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = 'Выберите низкий, средний или высокий приоритет.';
  }
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 ||
      !categories.some(category => category.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    value: valid ? { title, priority, categoryId } : null,
    errors,
  };
}

export function selectTasks(tasks, filters) {
  const search = filters.q.trim().toLocaleLowerCase('ru');
  return tasks.filter(task => (
    (!search || task.title.toLocaleLowerCase('ru').includes(search)) &&
    (filters.completed === '' || task.completed === (filters.completed === 'true')) &&
    (filters.priority === '' || task.priority === filters.priority) &&
    (filters.categoryId === '' || String(task.categoryId) === filters.categoryId)
  ));
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, value, id) {
  if (!Number.isSafeInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new RangeError('ID новой задачи должен быть положительным целым уникальным числом.');
  }
  return [...tasks, { id, ...value, completed: false }];
}

export function updateTask(tasks, id, value) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id
    ? { ...task, title: value.title, priority: value.priority, categoryId: value.categoryId }
    : task);
}

export function toggleTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function removeTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.filter(task => task.id !== id);
}

// Дополнительное задание: сортировка только отображаемых задач без изменения массива.
// Равные элементы сохраняют исходный порядок благодаря исходным индексам.
export function sortTasks(tasks, mode = 'default') {
  if (mode === 'default') return tasks;
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return tasks.map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const comparison = mode === 'title'
        ? a.task.title.localeCompare(b.task.title, 'ru')
        : mode === 'priority'
          ? priorityRank[a.task.priority] - priorityRank[b.task.priority]
          : 0;
      return comparison || a.index - b.index;
    })
    .map(({ task }) => task);
}
