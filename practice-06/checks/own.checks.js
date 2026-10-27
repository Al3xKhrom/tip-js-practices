// Дополнительные проверки к ПР6. Не изменяют готовые тесты преподавателя.
import assert from 'node:assert/strict';
import { createApiServer } from '../api/server.mjs';
import { ApiError, createApiClient } from '../src/api-client.js';
import { createTaskApi } from '../src/task-api.js';
import { getVariantFilters, variantNumber } from '../src/variant.js';

let passed = 0;
let failed = 0;
async function check(name, callback) {
  try { await callback(); ++passed; console.log(`OK: ${name}`); }
  catch (error) { ++failed; console.error(`FAIL: ${name}\n${error.stack}`); }
}

const server = createApiServer();
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl });
const api = createTaskApi(client);

try {
  await check('01. Собственная комбинация categoryId=2, completed=false, priority=high', async () => {
    const result = await api.getTasks({ categoryId: 2, completed: false, priority: 'high' });
    assert.deepEqual(result.tasks.map(t => t.id), [4, 34]);
    assert.equal(result.meta.total, 2);
  });

  await check('02. Неизвестная задача возвращает структурированную HTTP-ошибку 404', async () => {
    await assert.rejects(() => api.getTaskById(999), error => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.kind, 'http');
      assert.equal(error.status, 404);
      assert.equal(error.code, 'TASK_NOT_FOUND');
      return true;
    });
  });

  await check('03. Серверный JSON с повторяющимися id считается invalid-response', async () => {
    const sample = { id: 1, title: 'Тест', completed: false, priority: 'low', categoryId: 1 };
    const fake = createTaskApi({
      async requestJson() { return { data: [sample, { ...sample }], meta: { total: 2 } }; }
    });
    await assert.rejects(() => fake.getTasks(), error => error instanceof ApiError && error.kind === 'invalid-response');
  });

  await check('04. Индивидуальный вариант 5: перенос задачи ID 7 исключает её из categoryId=1', async () => {
    assert.equal(variantNumber, 5);
    const filters = getVariantFilters(variantNumber);
    assert.deepEqual(filters, { categoryId: 1 });
    const before = await api.getTasks(filters);
    assert.deepEqual(before.tasks.map(t => t.id), [1, 7, 13]);
    const moved = await api.updateTask(7, { title: before.tasks[1].title, priority: before.tasks[1].priority, categoryId: 2 });
    assert.equal(moved.categoryId, 2);
    const after = await api.getTasks(filters);
    assert.deepEqual(after.tasks.map(t => t.id), [1, 13]);
    assert.equal(after.meta.total, 2);
    await api.resetDemoData();
  });

  await check('05. Дополнительное задание: контроллер передаёт длительность загрузки представлению', async () => {
    const { createAppController } = await import('../src/app-controller.js');
    const durations = [];
    const cats = [{ id: 1, name: 'Учёба' }];
    const tasks = [{ id: 1, title: 'Тест', completed: false, priority: 'low', categoryId: 1 }];
    const view = {
      setListState() {}, setTasks() {}, setCategories() {}, setTotal() {},
      setFormTask() {}, showFormErrors() {}, setMutationPending() {}, notify() {},
      setLoadDuration(duration) { durations.push(duration); }
    };
    const fake = {
      async loadInitialData() { return { tasks, categories: cats, meta: { total: 1 } }; },
      async getTasks() { return { tasks, meta: { total: 1 } }; },
      async createTask() {}, async updateTask() {}, async setTaskCompleted() {},
      async deleteTask() {}, async resetDemoData() {},
    };
    const controller = createAppController({ api: fake, view });
    await controller.start();
    assert.equal(durations.length, 1);
    assert.ok(Number.isInteger(durations[0]) && durations[0] >= 0);
    await controller.refresh();
    assert.equal(durations.length, 2);
  });
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed) process.exitCode = 1;
