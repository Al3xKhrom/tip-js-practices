export class ApiError extends Error {
  constructor(message, { kind, status = null, code = null, details = null, url = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function checkedBase(baseUrl) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) throw new TypeError('Укажите абсолютный адрес API.');
  let url;
  try { url = new URL(baseUrl); } catch { throw new TypeError('Неверный адрес API.'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.search || url.hash || url.username || url.password) {
    throw new TypeError('API должен иметь абсолютный http(s)-адрес без query и hash.');
  }
  return url;
}

export function buildUrl(baseUrl, path, query = {}) {
  const base = checkedBase(baseUrl);
  if (typeof path !== 'string' || !path.trim() || /[?#]/.test(path) || /^\w+:\/\//.test(path)) {
    throw new TypeError('Нужен относительный путь без query и hash.');
  }
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw new TypeError('Query должен быть объектом.');
  const url = new URL(base.href);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.href;
}
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
function checkTimeout(ms) {
  if (!Number.isFinite(ms) || ms <= 0) throw new TypeError('timeoutMs должен быть положительным числом.');
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 3000 } = {}) {
  checkedBase(baseUrl);
  if (typeof fetchFn !== 'function') throw new TypeError('fetchFn должен быть функцией.');
  checkTimeout(timeoutMs);
  return {
    async requestJson(path, options = {}) {
      const { method = 'GET', query = {}, signal, timeoutMs: requestTimeout = timeoutMs } = options;
      if (typeof method !== 'string' || !ALLOWED_METHODS.has(method.toUpperCase())) throw new TypeError('Недопустимый HTTP-метод.');
      const normalizedMethod = method.toUpperCase();
      const hasBody = Object.prototype.hasOwnProperty.call(options, 'body') && options.body !== undefined;
      if (normalizedMethod === 'GET' && hasBody) throw new TypeError('GET не должен иметь body.');
      checkTimeout(requestTimeout);
      if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError('Требуется AbortSignal.');
      const url = buildUrl(baseUrl, path, query);
      const timeoutSignal = AbortSignal.timeout(requestTimeout);
      const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
      const headers = { Accept: 'application/json' };
      const request = { method: normalizedMethod, headers, signal: combined };
      if (hasBody) {
        headers['Content-Type'] = 'application/json';
        request.body = JSON.stringify(options.body);
      }
      let response;
      try {
        response = await fetchFn(url, request);
      } catch (cause) {
        const kind = signal?.aborted ? 'aborted' : timeoutSignal.aborted ? 'timeout' : 'network';
        const message = kind === 'timeout' ? 'Превышено время ожидания сервера.'
          : kind === 'aborted' ? 'Запрос отменён.' : 'Не удалось подключиться к серверу.';
        throw new ApiError(message, { kind, url, cause });
      }
      if (!(response instanceof Response)) {
        throw new ApiError('Сервер вернул не объект Response.', { kind: 'invalid-response', url });
      }
      if (!response.ok) {
        let payload;
        try { payload = await response.json(); } catch { /* Статус важнее типа ошибочного ответа. */ }
        const error = payload?.error && typeof payload.error === 'object' ? payload.error : {};
        throw new ApiError(
          typeof error.message === 'string' && error.message ? error.message : `HTTP ${response.status}`,
          { kind: 'http', status: response.status, code: error.code ?? null,
            details: error.details ?? null, url }
        );
      }
      if (response.status === 204) return null;
      const contentType = response.headers.get('content-type') ?? '';
      if (!/application\/json(?:\s*;|\s*$)/i.test(contentType)) {
        throw new ApiError('Ожидался ответ application/json.', { kind: 'invalid-response', url });
      }
      try {
        return await response.json();
      } catch (cause) {
        throw new ApiError('Не удалось разобрать JSON ответа.', { kind: 'invalid-response', url, cause });
      }
    }
  };
}