const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, tasks, editingId = null) {
    const errors = {};
    const data = draft && typeof draft === "object" ? draft : {};
    const taskList = Array.isArray(tasks) ? tasks : [];
    const rawId = editingId === null ? data.id : editingId;
    const id = typeof rawId === "string" ? Number(rawId) : rawId;

    // Проверка ID
    if (!Number.isSafeInteger(id) || id <= 0) {
        errors.id = "Введите положительный целый ID.";
    } else if (editingId === null && taskList.some((task) => task.id === id)) {
        errors.id = "Задача с таким ID уже существует.";
    } else if (editingId !== null && !taskList.some((task) => task.id === id)) {
        errors.id = "Редактируемая задача не найдена.";
    }

    // Проверка названия
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (title.length < 1 || title.length > 100) {
        errors.title = "Название должно содержать от 1 до 100 символов.";
    }

    // Проверка приоритета
    if (!ALLOWED_PRIORITIES.has(data.priority)) {
        errors.priority = "Выберите приоритет low, medium или high.";
    }

    // Если обнаружены ошибки
    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    // Если все значения правильные
    return {
        ok: true,
        value: {
            id,
            title,
            priority: data.priority
        }
    };
}