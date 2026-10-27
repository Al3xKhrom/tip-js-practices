// Общий контрольный запрос независимо от номера индивидуального варианта.
import { createApiClient, ApiError } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";

const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const api = createTaskApi(createApiClient({ baseUrl }));
try {
  const { tasks, categories, meta } = await api.loadInitialData({
    completed: false,
    priority: "high",
  });
  console.log("Общий запрос /tasks?completed=false&priority=high");
  console.log("id:", tasks.map(task => task.id));
  console.log("meta.total:", meta.total);
  console.log("Категории:", categories.map(c => `${c.id}: ${c.name}`).join("; "));
  try {
    await api.getTaskById(999);
  } catch (error) {
    if (error instanceof ApiError) {
      console.log(`Ошибка 999: kind=${error.kind}, status=${error.status}, code=${error.code}`);
    } else {
      throw error;
    }
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
