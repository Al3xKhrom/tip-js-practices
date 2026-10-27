import { ApiError } from "./api-client.js";

function describeFailure(error) {
  if (error instanceof ApiError) {
    return {
      kind: error.kind,
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      url: error.url,
    };
  }
  return {
    kind: "unexpected",
    message: error instanceof Error ? error.message : String(error),
    status: null,
    code: null,
    details: null,
    url: null,
  };
}

export async function loadPartialData(api, filters = {}) {
  if (!api || typeof api.getTasks !== "function"
    || typeof api.getCategories !== "function") {
    throw new TypeError("Требуется API с методами getTasks и getCategories.");
  }
  const [tasksResult, categoriesResult] = await Promise.allSettled([
    Promise.resolve().then(() => api.getTasks(filters)),
    Promise.resolve().then(() => api.getCategories()),
  ]);
  const tasksOk = tasksResult.status === "fulfilled";
  const categoriesOk = categoriesResult.status === "fulfilled";
  return {
    ok: tasksOk && categoriesOk,
    partial: tasksOk !== categoriesOk,
    tasks: tasksOk ? tasksResult.value.tasks : null,
    categories: categoriesOk ? categoriesResult.value : null,
    meta: tasksOk ? tasksResult.value.meta : null,
    errors: {
      tasks: tasksOk ? null : describeFailure(tasksResult.reason),
      categories: categoriesOk ? null : describeFailure(categoriesResult.reason),
    },
  };
}