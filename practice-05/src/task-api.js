import { ApiError } from "./api-client.js";
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);
function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}
function isTask(value) {
  return isObject(value)
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId);
}

function isCategory(value) {
  return isObject(value)
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100;
}

function validateCollection(payload, validator, type) {
  if (!isObject(payload) || !Array.isArray(payload.data)
    || !isObject(payload.meta)
    || !Number.isSafeInteger(payload.meta.total)
    || payload.meta.total !== payload.data.length) {
    throw invalidResponse(`Некорректная структура коллекции ${type} или meta.total.`);
  }
  const seen = new Set();
  for (const item of payload.data) {
    if (!validator(item) || seen.has(item.id)) {
      throw invalidResponse(`В коллекции ${type} обнаружена неверная запись или повтор id.`);
    }
    seen.add(item.id);
  }
  return payload.data;
}

function normalizeFilters(filters) {
  if (!isObject(filters) || ![Object.prototype, null].includes(Object.getPrototypeOf(filters))) {
    throw new TypeError("Фильтры должны быть обычным объектом.");
  }
  const normalized = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}.`);
    }
    if (key === "completed") {
      if (typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
      normalized.completed = value;
    } else if (key === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) throw new TypeError("Неизвестный приоритет.");
      normalized.priority = value;
    } else if (key === "categoryId") {
      if (!isPositiveSafeInteger(value)) throw new TypeError("categoryId должен быть положительным целым.");
      normalized.categoryId = value;
    } else {
      if (typeof value !== "string" || value.trim().length > 100) {
        throw new TypeError("Поисковая строка должна иметь длину до 100 символов.");
      }
      normalized.q = value.trim();
    }
  }
  return normalized;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("Требуется клиент с методом requestJson.");
  }
  return {
    async getTasks(filters = {}) {
      const query = normalizeFilters(filters);
      const payload = await client.requestJson("/tasks", { query });
      const tasks = validateCollection(payload, isTask, "задач");
      if (!isObject(payload.meta.filters)) {
        throw invalidResponse("Не передан объект meta.filters.");
      }
      return { tasks, meta: payload.meta };
    },
    async getTaskById(id) {
      if (!isPositiveSafeInteger(id)) {
        throw new TypeError("ID задачи должен быть положительным безопасным целым.");
      }
      const payload = await client.requestJson(`/tasks/${id}`);
      if (!isObject(payload) || !isTask(payload.data) || payload.data.id !== id) {
        throw invalidResponse("Неверная схема одиночной задачи.");
      }
      return payload.data;
    },
    async getCategories() {
      const payload = await client.requestJson("/categories");
      return validateCollection(payload, isCategory, "категорий");
    },
    async loadInitialData(filters = {}) {
      const tasksPromise = this.getTasks(filters);
      const categoriesPromise = this.getCategories();
      const [result, categories] = await Promise.all([tasksPromise, categoriesPromise]);
      return { tasks: result.tasks, categories, meta: result.meta };
    },
  };
}