export const STORAGE_VERSION = 1;

// Проверяет весь список задач, ничего в нём не изменяя.
export function isValidTaskList(value) {
    if (!Array.isArray(value)) return false;
    const ids = new Set();
    for (const task of value) {
        if (!task || typeof task !== "object" || Array.isArray(task)) return false;
        if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
        if (ids.has(task.id)) return false;
        ids.add(task.id);
        if (typeof task.title !== "string") return false;
        if (task.title.length < 1 || task.title.length > 100) return false;
        if (task.title !== task.title.trim()) return false;
        if (typeof task.completed !== "boolean") return false;
        if (!["low", "medium", "high"].includes(task.priority)) return false;
    }
    return true;
}

// Загружает сохранённый список либо независимую копию исходных задач.
export function loadTasks(storage, key, fallbackTasks) {
    const initialCopy = fallbackTasks.map(task => ({ ...task }));
    try {
        const raw = storage.getItem(key);
        if (raw === null) {
            return { ok: true, source: "initial", tasks: initialCopy };
        }
        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== "object" || saved.version !== STORAGE_VERSION) {
            return {
                ok: false,
                source: "fallback",
                tasks: initialCopy,
                error: "Неизвестная версия сохранённых данных. Восстановлен исходный список."
            };
        }
        if (!isValidTaskList(saved.tasks)) {
            return {
                ok: false,
                source: "fallback",
                tasks: initialCopy,
                error: "Некорректный список задач в хранилище. Восстановлен исходный список."
            };
        }
        return {
            ok: true,
            source: "storage",
            tasks: saved.tasks.map(task => ({ ...task }))
        };
    } catch (error) {
        return {
            ok: false,
            source: "fallback",
            tasks: initialCopy,
            error: `Ошибка чтения сохранённых задач: ${error.message}`
        };
    }
}

// Сохраняет список только после проверки схемы.
export function saveTasks(storage, key, tasks) {
    if (!isValidTaskList(tasks)) {
        return { ok: false, error: "Некорректный список задач. Сохранение отменено." };
    }
    try {
        const data = JSON.stringify({ version: STORAGE_VERSION, tasks });
        storage.setItem(key, data);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Ошибка сохранения задач: ${error.message}` };
    }
}

// Удаляет только указанный ключ, другие наборы не затрагивает.
export function removeSavedTasks(storage, key) {
    try {
        storage.removeItem(key);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: `Ошибка удаления сохранённых задач: ${error.message}` };
    }
}