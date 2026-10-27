// Демонстрация статуса, Content-Type, ok и формы ответа на готовом API.
const base = process.env.API_URL ?? "http://127.0.0.1:5505/api";
for (const path of [
  "/health", "/tasks", "/tasks?completed=false&priority=high",
  "/tasks/25", "/tasks/999", "/categories",
]) {
  const response = await fetch(base + path);
  const body = await response.json();
  console.log(`${path}: status=${response.status}, ok=${response.ok}, content-type=${response.headers.get("content-type")}`);
  console.log("  тип тела:", Array.isArray(body.data) ? "коллекция" : body.error ? "ошибка" : "объект");
  console.log("  id:", Array.isArray(body.data) ? body.data.map(x => x.id) : (body.data?.id ?? null));
  if (body.error) console.log("  code:", body.error.code);
}
