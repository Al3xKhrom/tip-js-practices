// Собственные проверки для отчёта и дополнительного варианта А.
import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, createApiClient, buildUrl } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { loadPartialData } from "../src/partial-load.js";

let passed = 0;
let failed = 0;
async function check(label, run) {
  try {
    await run();
    passed++;
    console.log(`OK: ${label}`);
  } catch (error) {
    failed++;
    console.error(`FAIL: ${label}\n${error.stack ?? error}`);
  }
}

const server = createApiServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const url = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl: url, timeoutMs: 1000 });
const api = createTaskApi(client);

try {
  await check("Собственная 1: комбинация categoryId=1, completed=false, priority=high", async () => {
    const filters = Object.freeze({ categoryId: 1, completed: false, priority: "high" });
    const response = await api.getTasks(filters);
    assert.deepEqual(response.tasks.map((t) => t.id), [13]);
    assert.equal(response.meta.total, 1);
    assert.equal(buildUrl(url, "/tasks", filters).includes("completed=false"), true);
  });

  await check("Собственная 2: повторяющийся query-параметр даёт HTTP 400", async () => {
    let caught;
    try {
      await client.requestJson("/tasks?completed=true&completed=false");
    } catch (e) {
      caught = e;
    }
    // Путь по контракту должен быть относительным без query. Выполняем реальный HTTP-запрос
    // с повтором параметра через сырой fetch и проверяем серверный контракт.
    assert.ok(caught instanceof TypeError);
    const response = await fetch(`${url}/tasks?completed=true&completed=false`);
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "INVALID_QUERY");
  });

  await check("Собственная 3: неправильная схема — строковый completed при корректном JSON", async () => {
    const fake = createTaskApi({
      async requestJson() {
        return {
          data: [{ id: 91, title: "Проверка", completed: "false", priority: "low", categoryId: 1 }],
          meta: { total: 1, filters: {} },
        };
      },
    });
    await assert.rejects(() => fake.getTasks(), e => e instanceof ApiError && e.kind === "invalid-response");
  });

  const tasks = { tasks: [{ id: 1 }], meta: { total: 1 } };
  const categories = [{ id: 2, name: "Проект" }];
  const taskError = new ApiError("Задачи недоступны", { kind: "http", status: 503, code: "SERVICE_UNAVAILABLE" });
  const categoryError = new ApiError("Категории недоступны", { kind: "network" });

  await check("Доп. А1: оба запроса успешны", async () => {
    const result = await loadPartialData({
      async getTasks() { return tasks; },
      async getCategories() { return categories; },
    });
    assert.equal(result.ok, true);
    assert.equal(result.partial, false);
    assert.deepEqual(result.tasks, tasks.tasks);
    assert.deepEqual(result.categories, categories);
    assert.deepEqual(result.errors, { tasks: null, categories: null });
  });

  await check("Доп. А2: задачи недоступны, категории получены", async () => {
    const result = await loadPartialData({
      async getTasks() { throw taskError; },
      async getCategories() { return categories; },
    });
    assert.equal(result.ok, false);
    assert.equal(result.partial, true);
    assert.equal(result.tasks, null);
    assert.deepEqual(result.categories, categories);
    assert.equal(result.errors.tasks.kind, "http");
    assert.equal(result.errors.tasks.status, 503);
    assert.equal(result.errors.tasks.code, "SERVICE_UNAVAILABLE");
  });

  await check("Доп. А3: категории недоступны, задачи получены", async () => {
    const result = await loadPartialData({
      async getTasks() { return tasks; },
      async getCategories() { throw categoryError; },
    });
    assert.equal(result.ok, false);
    assert.equal(result.partial, true);
    assert.deepEqual(result.tasks, tasks.tasks);
    assert.equal(result.categories, null);
    assert.equal(result.errors.categories.kind, "network");
  });

  await check("Доп. А4: обе операции завершились отказом", async () => {
    const result = await loadPartialData({
      async getTasks() { throw taskError; },
      async getCategories() { throw categoryError; },
    });
    assert.equal(result.ok, false);
    assert.equal(result.partial, false);
    assert.equal(result.tasks, null);
    assert.equal(result.categories, null);
    assert.equal(result.errors.tasks.kind, "http");
    assert.equal(result.errors.categories.kind, "network");
  });
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;
