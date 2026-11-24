// Отдельный запуск для задания №4 КР3; штатный src/server.js не изменён.
import { createApp } from './app.js';
const port = 5505;
const server = createApp({ enableKr3Post: true }).listen(port, '127.0.0.1', () => {
  console.log(`КР3: API GET и POST на http://127.0.0.1:${port}/api`);
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Порт 5505 занят. Остановите другой API.' : error.message);
  process.exitCode = 1;
});
