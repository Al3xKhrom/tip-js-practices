import { ApiError } from './errors.js';

/** Положительный безопасный целый id в канонической десятичной записи. */
export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/** Строгая проверка GET /tasks; повторяющиеся и неизвестные ключи запрещены. */
export function parseFilters(searchParams) {
  const allowed = new Set(['completed', 'priority', 'categoryId', 'q']);
  const seen = new Set();
  for (const [name] of searchParams) {
    if (!allowed.has(name)) {
      throw new ApiError(400, 'INVALID_QUERY', `Неизвестный параметр: ${name}.`);
    }
    if (seen.has(name)) {
      throw new ApiError(400, 'INVALID_QUERY', `Повторяется параметр: ${name}.`);
    }
    seen.add(name);
  }

  const filters = { completed: null, priority: null, categoryId: null, q: '' };
  if (seen.has('completed')) {
    const value = searchParams.get('completed');
    if (value !== 'true' && value !== 'false') {
      throw new ApiError(400, 'INVALID_QUERY', 'Статус должен быть true или false.');
    }
    filters.completed = value === 'true';
  }
  if (seen.has('priority')) {
    const value = searchParams.get('priority');
    if (!['low', 'medium', 'high'].includes(value)) {
      throw new ApiError(400, 'INVALID_QUERY', 'Недопустимый приоритет.');
    }
    filters.priority = value;
  }
  if (seen.has('categoryId')) {
    const id = parsePositiveId(searchParams.get('categoryId'));
    if (id === null) {
      throw new ApiError(400, 'INVALID_QUERY', 'Некорректный идентификатор категории.');
    }
    filters.categoryId = id;
  }
  if (seen.has('q')) {
    const q = searchParams.get('q').trim();
    if (q.length > 100) {
      throw new ApiError(400, 'INVALID_QUERY', 'Поиск не может быть длиннее 100 символов.');
    }
    filters.q = q;
  }
  return filters;
}

/** Дополнение только для КР3: проверка POST /api/tasks (в обычной ПР9 POST запрещён). */
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  if (title.length === 0 || title.length > 100) {
    errors.title = 'Название должно содержать от 1 до 100 символов.';
  }
  const priority = draft?.priority;
  if (!['low', 'medium', 'high'].includes(priority)) {
    errors.priority = 'Выберите приоритет low, medium или high.';
  }
  const rawCategoryId = draft?.categoryId;
  const categoryId = typeof rawCategoryId === 'number' ? rawCategoryId :
    typeof rawCategoryId === 'string' && /^[1-9]\d*$/.test(rawCategoryId) ? Number(rawCategoryId) : NaN;
  if (!Number.isSafeInteger(categoryId) || !categories.some(c => c.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    value: { title, priority, categoryId },
    errors,
  };
}
