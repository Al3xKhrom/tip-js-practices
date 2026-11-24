import express from 'express';
import { createStore } from './store.js';
import { createRouter } from './routes.js';
import { ApiError, errorHandler } from './errors.js';

export function createApp({ store = createStore(), enableKr3Post = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.set('case sensitive routing', true);
  app.use((req, res, next) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': enableKr3Post ? 'GET, HEAD, POST, OPTIONS' : 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept, Content-Type',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
  // В обычном режиме сохраняем исходный контракт GET-only практики №9.
  if (enableKr3Post) app.use(express.json({ limit: '16kb' }));
  app.use('/api', createRouter(store, { enableKr3Post }));
  app.use((req, res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'Маршрут не найден.')));
  app.use(errorHandler);
  return app;
}
