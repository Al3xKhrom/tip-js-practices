// Четыре сценария дополнительного задания А.
import { ApiError } from "../src/api-client.js";
import { loadPartialData } from "../src/partial-load.js";

const tasks = { tasks: [{ id: 1, title: "Тест" }], meta: { total: 1 } };
const categories = [{ id: 1, name: "Учёба" }];
const failure = new ApiError("Сервис недоступен", {
  kind: "http", status: 503, code: "SERVICE_UNAVAILABLE",
});

for (const [name, failTasks, failCategories] of [
  ["Оба успешны", false, false],
  ["Ошибка задач", true, false],
  ["Ошибка категорий", false, true],
  ["Обе ошибки", true, true],
]) {
  const result = await loadPartialData({
    async getTasks() {
      if (failTasks) throw failure;
      return tasks;
    },
    async getCategories() {
      if (failCategories) throw failure;
      return categories;
    },
  });
  console.log(name, {
    ok: result.ok,
    partial: result.partial,
    tasks: result.tasks?.length ?? null,
    categories: result.categories?.length ?? null,
    errorTasks: result.errors.tasks?.kind ?? null,
    errorCategories: result.errors.categories?.kind ?? null,
  });
}
