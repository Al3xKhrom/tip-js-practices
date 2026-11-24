import { useEffect, useRef, useState } from 'react';

/**
 * Единый источник серверных данных для интерфейса ПР8.
 * Важные гарантии: устаревший ответ не изменяет состояние, чтение и запись
 * отменяются отдельно, а повторные синхронные вызовы мутации блокируются ref.
 */
export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({
    tasks: [], categories: [], meta: { total: 0 },
  });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  // Дополнительное задание: время последнего УСПЕШНОГО получения данных.
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const mountedRef = useRef(false);
  const pendingRef = useRef(false);
  const mutationControllerRef = useRef(null);

  const { q, completed, priority, categoryId } = filters;

  // Отдельный эффект жизни компонента корректно переживает StrictMode.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      mutationControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const result = await api.loadInitialData(
          { q, completed, priority, categoryId },
          { signal: controller.signal },
        );
        if (!isCurrent || !mountedRef.current || controller.signal.aborted) return;
        setSnapshot(result);
        setStatus('ready');
        setError(null);
        setLastUpdatedAt(new Date().toISOString());
      } catch (loadError) {
        // При отмене или новой выборке игнорируются И успехи, И ошибки.
        if (!isCurrent || !mountedRef.current || controller.signal.aborted) return;
        if (loadError?.name === 'AbortError' || loadError?.kind === 'aborted') return;
        setError(loadError);
        setStatus('error');
        // snapshot намеренно не очищается: показываем последние успешные данные.
      }
    }

    void load();
    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    if (!mountedRef.current) return;
    setRevision(previous => previous + 1);
  }

  async function mutate(operation) {
    // ref блокирует второй вызов немедленно, до обновления состояния React.
    if (!mountedRef.current || pendingRef.current) return false;
    const controller = new AbortController();
    pendingRef.current = true;
    mutationControllerRef.current = controller;
    setPending(true);
    setMutationError(null);

    try {
      await operation({ signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted) return false;
      // Успешная запись не зависит от возможной ошибки следующего GET.
      setRevision(previous => previous + 1);
      return true;
    } catch (mutationFailure) {
      if (!mountedRef.current || controller.signal.aborted) return false;
      setMutationError(mutationFailure);
      return false;
    } finally {
      // Старая операция не освобождает блокировку операции, пришедшей позже.
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
        pendingRef.current = false;
        if (mountedRef.current) setPending(false);
      }
    }
  }

  function saveTask(id, value) {
    return id == null
      ? mutate(options => api.createTask(value, options))
      : mutate(options => api.updateTask(id, value, options));
  }
  function toggleTask(task) {
    return mutate(options => api.setTaskCompleted(task.id, !task.completed, options));
  }
  function deleteTask(id) {
    return mutate(options => api.deleteTask(id, options));
  }
  function resetData() {
    return mutate(options => api.resetDemoData(options));
  }

  return {
    snapshot, status, error, mutationError, pending, lastUpdatedAt,
    refresh, saveTask, toggleTask, deleteTask, resetData,
  };
}
