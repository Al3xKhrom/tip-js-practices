export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function normalizedBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new TypeError("baseUrl должен быть абсолютным HTTP(S)-адресом.");
  }
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new TypeError("Некорректный baseUrl.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)
    || parsed.search || parsed.hash || baseUrl.includes("?") || baseUrl.includes("#")) {
    throw new TypeError("baseUrl должен быть HTTP(S)-адресом без query и hash.");
  }
  return parsed;
}

export function buildUrl(baseUrl, path, query = {}) {
  const base = normalizedBaseUrl(baseUrl);
  if (typeof path !== "string" || !path.trim() || path.includes("?") || path.includes("#")
    || path.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    throw new TypeError("path должен быть непустым относительным путём.");
  }
  if (!query || typeof query !== "object" || Array.isArray(query)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(query))) {
    throw new TypeError("query должен быть обычным объектом.");
  }
  const basePath = base.pathname.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  base.pathname = `${basePath}/${relativePath}`;
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      base.searchParams.set(key, String(value));
    }
  }
  return base.toString();
}

function positiveTimeout(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function errorFromFetch(error, url, externalSignal, timeoutSignal) {
  if (externalSignal?.aborted) {
    return new ApiError("Запрос отменён вызывающим кодом.", {
      kind: "aborted", url, cause: error,
    });
  }
  if (timeoutSignal.aborted) {
    return new ApiError("Превышено время ожидания ответа.", {
      kind: "timeout", url, cause: error,
    });
  }
  return new ApiError("Сетевая ошибка при выполнении запроса.", {
    kind: "network", url, cause: error,
  });
}

export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  const parsedBase = normalizedBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!positiveTimeout(timeoutMs)) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }
  const normalizedBase = parsedBase.toString();
  return {
    async requestJson(path, { query = {}, signal, timeoutMs: overrideMs = timeoutMs } = {}) {
      if (!positiveTimeout(overrideMs)) {
        throw new TypeError("timeoutMs должен быть положительным целым числом.");
      }
      if (signal !== undefined && !(signal instanceof AbortSignal)) {
        throw new TypeError("signal должен быть AbortSignal.");
      }

      const url = buildUrl(normalizedBase, path, query);
      const timeoutSignal = AbortSignal.timeout(overrideMs);
      const combinedSignal = signal
        ? AbortSignal.any([signal, timeoutSignal])
        : timeoutSignal;
      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: combinedSignal,
        });
      } catch (error) {
        throw errorFromFetch(error, url, signal, timeoutSignal);
      }

      if (!(response instanceof Response)) {
        throw new ApiError("fetch вернул значение, не являющееся Response.", {
          kind: "invalid-response", url,
        });
      }
      if (!response.ok) {
        let errorPayload = null;
        const contentType = response.headers.get("content-type") ?? "";
        if (/\bapplication\/json\b/i.test(contentType)) {
          try {
            errorPayload = await response.json();
          } catch {
          }
        }
        const info = errorPayload?.error;
        const validInfo = info && typeof info === "object" && !Array.isArray(info);
        throw new ApiError(
          validInfo && typeof info.message === "string" && info.message
            ? info.message
            : `HTTP ${response.status}: запрос завершился ошибкой.`,
          {
            kind: "http",
            status: response.status,
            code: validInfo && typeof info.code === "string" ? info.code : null,
            details: validInfo && info.details !== undefined ? info.details : null,
            url,
          },
        );
      }
      if (response.status === 204) return null;
      const contentType = response.headers.get("content-type") ?? "";
      if (!/\bapplication\/json\b/i.test(contentType)) {
        throw new ApiError("Ответ имеет неверный Content-Type: ожидался JSON.", {
          kind: "invalid-response", url,
        });
      }
      try {
        return await response.json();
      } catch (cause) {
        if (combinedSignal.aborted) {
          throw errorFromFetch(cause, url, signal, timeoutSignal);
        }
        throw new ApiError("Не удалось разобрать JSON ответа.", {
          kind: "invalid-response", url, cause,
        });
      }
    },
  };
}