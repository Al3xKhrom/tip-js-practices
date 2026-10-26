// Внутренние функции-помощники
function isValidId(id) {
    return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

function validateAndTrimTitle(title) {
    if (typeof title !== 'string') return null;
    const trimmed = title.trim();
    return (trimmed.length >= 1 && trimmed.length <= 100) ? trimmed : null;
}

// Экспортируемые функции
export function createTask(id, title, priority = "medium") {
    if (!isValidId(id)) return { ok: false, error: "id должен быть положительным целым безопасным числом" };
    if (typeof title !== 'string') return { ok: false, error: "title должен быть строкой" };

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
        return { ok: false, error: "длина названия должна быть от 1 до 100 символов" };
    }
    if (priority !== "low" && priority !== "medium" && priority !== "high") {
        return { ok: false, error: "priority должен быть 'low', 'medium' или 'high'" };
    }

    return {
        ok: true,
        task: { id, title: trimmedTitle, completed: false, priority }
    };
}

export function findTaskById(tasks, id) {
    return tasks.find(task => task.id === id);
}

export function getPendingTasks(tasks) {
    return tasks.filter(task => task.completed === false);
}

export function getTaskTitles(tasks) {
    return tasks.map(task => task.title);
}

export function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed === true).length;
    const pending = total - completed;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
    const newTaskResult = createTask(id, title, priority);
    if (!newTaskResult.ok) return newTaskResult;
    if (tasks.some(task => task.id === id)) return { ok: false, error: "Задача с таким id уже существует" };
    return { ok: true, tasks: [...tasks, newTaskResult.task] };
}

export function setTaskCompleted(tasks, id, completed) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    if (typeof completed !== 'boolean') return { ok: false, error: "Статус должен быть логическим значением true или false" };

    const taskExists = tasks.some(task => task.id === id);
    if (!taskExists) return { ok: false, error: "Задача не найдена" };

    const newTasks = tasks.map(task => task.id === id ? { ...task, completed: completed } : task);
    return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    const trimmedTitle = validateAndTrimTitle(title);
    if (trimmedTitle === null) return { ok: false, error: "Некорректное название задачи" };

    const taskExists = tasks.some(task => task.id === id);
    if (!taskExists) return { ok: false, error: "Задача не найдена" };

    const newTasks = tasks.map(task => task.id === id ? { ...task, title: trimmedTitle } : task);
    return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    const taskExists = tasks.some(task => task.id === id);
    if (!taskExists) return { ok: false, error: "Задача не найдена" };

    const newTasks = tasks.filter(task => task.id !== id);
    return { ok: true, tasks: newTasks };
}