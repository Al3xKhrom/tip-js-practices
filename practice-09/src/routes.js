import { Router } from 'express';
import { ApiError } from './errors.js';
import { parseFilters, parsePositiveId, validateTaskDraft } from './validation.js';

export function createRouter(store, { enableKr3Post = false } = {}) {
  const router = Router({ caseSensitive: true });

  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    return res.status(200).json({ data, meta: { total: data.length } });
  });

  router.get('/tasks', (req, res) => {
    // Сохраняем повторяющиеся параметры, чтобы распознать INVALID_QUERY.
    const searchParams = new URL(req.originalUrl, 'http://localhost').searchParams;
    const filters = parseFilters(searchParams);
    const data = store.listTasks(filters);
    return res.status(200).json({ data, meta: { total: data.length, filters } });
  });

  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный id задачи.');
    const task = store.getTask(id);
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    return res.status(200).json({ data: task });
  });

  // Дополнительный режим КР3. При обычном npm start маршрут не регистрируется.
  if (enableKr3Post) {
    router.post('/tasks', (req, res) => {
      const checked = validateTaskDraft(req.body, store.listCategories());
      if (!checked.valid) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Ошибки заполнения задачи.', checked.errors);
      }
      const created = store.createTask(checked.value);
      res.location(`/api/tasks/${created.id}`);
      return res.status(201).json({ data: created });
    });
  }

  // ПР9 разрешает только чтение в штатном режиме; GET предшествует HEAD.
  const methodNotAllowed = (req, res) => {
    res.set('Allow', enableKr3Post && req.path === '/tasks' ? 'GET, HEAD, POST, OPTIONS' : 'GET, HEAD, OPTIONS');
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод недоступен в ПР9.');
  };
  router.all('/health', methodNotAllowed);
  router.all('/categories', methodNotAllowed);
  router.all('/tasks', methodNotAllowed);
  router.all('/tasks/:id', methodNotAllowed);
  return router;
}
