import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePositiveId } from '../src/validation.js';
import { createApp } from '../src/app.js';
import { once } from 'node:events';

// Дополнительное задание: граничное безопасное положительное целое.
test('Дополнительно: максимальный безопасный id и соседние неверные значения', () => {
  assert.equal(parsePositiveId(String(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
  assert.equal(parsePositiveId(String(Number.MAX_SAFE_INTEGER + 1)), null);
  assert.equal(parsePositiveId('0001'), null);
});

// Дополнительная проверка изоляции экземпляров приложения.
test('Дополнительно: два экземпляра createApp независимо обрабатывают запросы', async () => {
  const first = createApp().listen(0, '127.0.0.1');
  const second = createApp().listen(0, '127.0.0.1');
  try {
    await Promise.all([once(first, 'listening'), once(second, 'listening')]);
    const endpoints = [first, second].map(server => `http://127.0.0.1:${server.address().port}/api/tasks?categoryId=1`);
    for (const url of endpoints) {
      const response = await fetch(url);
      const result = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(result.data.map(item => item.id), [1, 7, 13]);
      assert.equal(result.meta.total, 3);
    }
  } finally {
    await Promise.all([first, second].map(server => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))));
  }
});
