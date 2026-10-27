import { ApiError } from './api-client.js';
const PRIORITIES = new Set(['low', 'medium', 'high']);
const FILTERS = new Set(['completed', 'priority', 'categoryId', 'q']);
const positiveId = id => Number.isSafeInteger(id) && id > 0;
const bad = message => new ApiError(message, { kind: 'invalid-response' });

export function isTask(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && positiveId(value.id) && typeof value.title === 'string'
    && value.title.trim().length >= 1 && value.title.trim().length <= 100
    && value.title === value.title.trim()
    && typeof value.completed === 'boolean' && PRIORITIES.has(value.priority)
    && positiveId(value.categoryId));
}
export function isCategory(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && positiveId(value.id) && typeof value.name === 'string'
    && value.name.trim().length >= 1 && value.name.trim().length <= 100);
}
function ensureCollection(payload, predicate, label) {
  if (!payload || !Array.isArray(payload.data) || !payload.meta
    || !Number.isSafeInteger(payload.meta.total) || payload.meta.total !== payload.data.length) {
    throw bad(`Неверная схема коллекции ${label}.`);
  }
  const ids = new Set();
  for (const item of payload.data) {
    if (!predicate(item) || ids.has(item.id)) throw bad(`Неверная запись или дублирующийся ID в ${label}.`);
    ids.add(item.id);
  }
  return payload.data;
}
function unwrapTask(payload) {
  if (!payload || !isTask(payload.data)) throw bad('Неверная схема задачи.');
  return payload.data;
}
function normalizeFilters(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw new TypeError('Фильтры должны быть объектом.');
  const normalized = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}.`);
    if (key === 'completed') {
      if (typeof value !== 'boolean') throw new TypeError('completed должен быть boolean.');
      normalized.completed = value;
    } else if (key === 'priority') {
      if (!PRIORITIES.has(value)) throw new TypeError('Неизвестный приоритет.');
      normalized.priority = value;
    } else if (key === 'categoryId') {
      if (!positiveId(value)) throw new TypeError('Неверный categoryId.');
      normalized.categoryId = value;
    } else if (key === 'q') {
      if (typeof value !== 'string' || value.trim().length > 100) throw new TypeError('Неверная строка поиска.');
      if (value.trim()) normalized.q = value.trim();
    }
  }
  return normalized;
}
function checkId(id) {
  if (!positiveId(id)) throw new TypeError('ID должен быть положительным безопасным целым.');
}
const signalOptions = options => ({ ...(options?.signal ? { signal: options.signal } : {}) });

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== 'function') throw new TypeError('Нужен HTTP-клиент с requestJson.');

  async function getTasks(filters = {}, options = {}) {
    const query = normalizeFilters(filters);
    const result = await client.requestJson('/tasks', { query, ...signalOptions(options) });
    const tasks = ensureCollection(result, isTask, 'задач');
    return { tasks, meta: result.meta };
  }
  async function getCategories(options = {}) {
    const result = await client.requestJson('/categories', signalOptions(options));
    return ensureCollection(result, isCategory, 'категорий');
  }
  async function getTaskById(id, options = {}) {
    checkId(id);
    return unwrapTask(await client.requestJson(`/tasks/${id}`, signalOptions(options)));
  }
  async function loadInitialData(filters = {}, options = {}) {
    const tasksPromise = getTasks(filters, options);
    const categoriesPromise = getCategories(options);
    const [{ tasks, meta }, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return { tasks, categories, meta };
  }
  async function createTask(draft, options = {}) {
    return unwrapTask(await client.requestJson('/tasks', { method: 'POST', body: draft, ...signalOptions(options) }));
  }
  async function updateTask(id, changes, options = {}) {
    checkId(id);
    return unwrapTask(await client.requestJson(`/tasks/${id}`, { method: 'PATCH', body: changes, ...signalOptions(options) }));
  }
  async function setTaskCompleted(id, completed, options = {}) {
    checkId(id);
    if (typeof completed !== 'boolean') throw new TypeError('completed должен быть boolean.');
    return unwrapTask(await client.requestJson(`/tasks/${id}`, { method: 'PATCH', body: { completed }, ...signalOptions(options) }));
  }
  async function deleteTask(id, options = {}) {
    checkId(id);
    const result = await client.requestJson(`/tasks/${id}`, { method: 'DELETE', ...signalOptions(options) });
    if (result !== null) throw bad('DELETE должен возвращать 204 без тела.');
    return null;
  }
  async function resetDemoData(options = {}) {
    const result = await client.requestJson('/debug/reset', { method: 'POST', ...signalOptions(options) });
    if (!result || result.data?.reset !== true || !Number.isSafeInteger(result.data?.total)) throw bad('Неверный ответ сброса.');
    return result.data;
  }
  return { getTasks, getCategories, getTaskById, loadInitialData,
    createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData };
}