import { createApiClient } from "./src/api-client.js";
import { createTaskApi } from "./src/task-api.js";

// Создаём общий HTTP-клиент
const client = createApiClient({
    baseUrl: "http://127.0.0.1:5505/api",
    timeoutMs: 2000
});

// Создаём предметный API
const api = createTaskApi(client);


// ЗАДАНИЕ 3 — Получение задач
if (process.argv[2] === "3") {

    const filters = {
        completed: false,
        priority: "high"
    };

    const result = await api.getTasks(filters);

    console.log("КР2. Задание 3: получение задач с сервера");
    console.log("Запрос: GET /api/tasks?completed=false&priority=high");
    console.log("ID:", result.tasks.map(task => task.id));
    console.log("meta.total:", result.meta.total);
}


// ЗАДАНИЕ 4 — Обработка ошибки
else if (process.argv[2] === "4") {

    console.log("КР2. Задание 4: обработка HTTP-ошибки");
    console.log("Запрос: GET /api/tasks/999");

    try {
        await api.getTaskById(999);

        console.log("ОШИБКА: сервер не вернул ожидаемый отказ");

    } catch (error) {
        console.log("kind:", error.kind);
        console.log("status:", error.status);
    }
}