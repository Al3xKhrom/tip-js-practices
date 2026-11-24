import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

test('КР3: исходный режим ПР9 запрещает POST с 405', async () => {
  const server = createApp().listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/tasks`, { method: 'POST' });
    assert.equal(response.status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('КР3: отсутствие title вызывает 400 VALIDATION_ERROR', async () => {
  const server = createApp({ enableKr3Post: true }).listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/tasks`;
    const send = async body => {
      const response = await fetch(base, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: response.status, payload: await response.json() };
    };
    const invalid = await send({ title: '   ', priority: 'medium', categoryId: 1 });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.payload.error.code, 'VALIDATION_ERROR');
    assert.ok(invalid.payload.error.details.title);
    const missing = await send({ priority: 'medium', categoryId: 1 });
    assert.equal(missing.status, 400);
    assert.ok(missing.payload.error.details.title);
    const valid = await send({ title: '  Тест КР3  ', priority: 'medium', categoryId: 1 });
    assert.equal(valid.status, 201);
    assert.equal(valid.payload.data.title, 'Тест КР3');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
