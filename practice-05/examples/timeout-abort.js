// Опыты с реальным локальным сервером: npm start должен работать.
import { ApiError, createApiClient } from "../src/api-client.js";
const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl });
async function check(label, pending) {
  try {
    await pending;
    console.log(label, "неожиданный успех");
    process.exitCode = 1;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    console.log(`${label}: kind=${error.kind}`);
  }
}
await check("Тайм-аут", client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 }));
const controller = new AbortController();
const pending = client.requestJson("/debug/delay", {
  query: { ms: 150 }, signal: controller.signal, timeoutMs: 1000,
});
controller.abort();
await check("Внешняя отмена", pending);
