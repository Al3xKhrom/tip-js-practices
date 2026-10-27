import { ApiError } from './api-client.js';
import { validateTaskDraft } from './form-validation.js';

export function messageForError(error) {
  if (!(error instanceof ApiError)) return 'Не удалось выполнить операцию.';
  if (error.kind === 'timeout') return 'Сервер не ответил вовремя. Попробуйте ещё раз.';
  if (error.kind === 'aborted') return 'Запрос отменён.';
  if (error.kind === 'network') return 'Нет соединения с учебным API. Проверьте, запущен ли npm start.';
  if (error.kind === 'invalid-response') return 'Сервер вернул ответ неожиданного формата.';
  if (error.kind === 'http' && error.status === 404) return 'Запись уже отсутствует на сервере. Обновите список.';
  if (error.kind === 'http') return error.message || `Сервер вернул ошибку ${error.status}.`;
  return 'Не удалось выполнить операцию.';
}
const API_METHODS = [
  'loadInitialData', 'getTasks', 'createTask', 'updateTask',
  'setTaskCompleted', 'deleteTask', 'resetDemoData'
];
const VIEW_METHODS = [
  'setListState', 'setTasks', 'setCategories', 'setTotal',
  'setFormTask', 'showFormErrors', 'setMutationPending', 'notify'
];

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  if (!api || API_METHODS.some(name => typeof api[name] !== 'function')
    || !view || VIEW_METHODS.some(name => typeof view[name] !== 'function')
    || typeof validateDraft !== 'function') {
    throw new TypeError('Необходимо передать API, представление и функцию проверки формы.');
  }
  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;
  let currentController = null;
  let sequence = 0;
  let pending = false;
  let destroyed = false;
  let hasCategories = false;

  async function loadCurrentTasks() {
    if (destroyed) return;
    currentController?.abort();
    const controller = new AbortController();
    currentController = controller;
    const ticket = ++sequence;
    const started = performance.now();
    view.setListState('loading');
    try {
      if (!hasCategories) {
        const loaded = await api.loadInitialData({ ...filters }, { signal: controller.signal });
        if (destroyed || ticket !== sequence) return;
        tasks = loaded.tasks;
        categories = loaded.categories;
        hasCategories = true;
        view.setCategories(categories);
        view.setTasks(tasks, categories);
        view.setTotal(loaded.meta.total);
      } else {
        const loaded = await api.getTasks({ ...filters }, { signal: controller.signal });
        if (destroyed || ticket !== sequence) return;
        tasks = loaded.tasks;
        view.setTasks(tasks, categories);
        view.setTotal(loaded.meta.total);
      }
      view.setListState(tasks.length ? 'ready' : 'empty');
    } catch (error) {
      if (destroyed || ticket !== sequence || controller.signal.aborted
        || (error instanceof ApiError && error.kind === 'aborted')) return;
      view.setListState('error', messageForError(error));
    } finally {
      if (ticket === sequence) {
        currentController = null;
        // Дополнительное задание: измерение времени запроса, если view поддерживает метод.
        if (!destroyed && typeof view.setLoadDuration === 'function') {
          view.setLoadDuration(Math.round(performance.now() - started));
        }
      }
    }
  }

  async function runMutation(action, successMessage, { clearForm = false } = {}) {
    if (destroyed || pending) return;
    pending = true;
    view.setMutationPending(true);
    try {
      await action();
      if (destroyed) return;
      if (clearForm) {
        editingId = null;
        view.setFormTask(null);
        view.showFormErrors({});
      }
      await loadCurrentTasks();
      if (!destroyed) view.notify(successMessage, 'success');
    } catch (error) {
      if (!destroyed) view.notify(messageForError(error), 'error');
    } finally {
      pending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }

  const controller = {
    start(nextFilters = {}) {
      filters = { ...nextFilters };
      editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
      return loadCurrentTasks();
    },
    applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      return loadCurrentTasks();
    },
    refresh() { return loadCurrentTasks(); },
    beginEdit(id) {
      if (pending || destroyed) return false;
      const task = tasks.find(item => item.id === id);
      if (!task) {
        view.notify('Выбранная задача отсутствует в текущем списке.', 'error');
        return false;
      }
      editingId = task.id;
      view.showFormErrors({});
      view.setFormTask(task);
      return true;
    },
    cancelEdit() {
      editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
    },
    async submit(draft) {
      if (pending || destroyed) return;
      const result = validateDraft(draft, categories);
      if (!result.valid) {
        view.showFormErrors(result.errors);
        return;
      }
      const id = editingId;
      await runMutation(
        () => id === null ? api.createTask(result.value) : api.updateTask(id, result.value),
        id === null ? 'Задача добавлена.' : 'Задача обновлена.',
        { clearForm: true }
      );
    },
    async toggleTask(id) {
      const task = tasks.find(item => item.id === id);
      if (!task) {
        view.notify('Задача отсутствует в текущем списке.', 'error');
        return;
      }
      await runMutation(() => api.setTaskCompleted(id, !task.completed), 'Статус обновлён.');
    },
    async deleteTask(id) {
      if (!tasks.some(item => item.id === id)) {
        view.notify('Задача отсутствует в текущем списке.', 'error');
        return;
      }
      await runMutation(() => api.deleteTask(id), 'Задача удалена.', { clearForm: editingId === id });
    },
    async resetData() {
      await runMutation(() => api.resetDemoData(), 'Исходный набор восстановлен.', { clearForm: true });
    },
    destroy() {
      destroyed = true;
      sequence++;
      currentController?.abort();
      currentController = null;
    }
  };
  return controller;
}