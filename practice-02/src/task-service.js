export function createTask(id, title, priority = "medium") {
    //Проверка id
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
        return { ok: false, error: "id должен быть положительным целым безопасным числом" };
    }
    //Проверка title
    if (typeof title !== 'string') {
        return { ok: false, error: "title должен быть строкой" };
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
        return { ok: false, error: "длина названия должна быть от 1 до 100 символов" };
    }
    //Проверка priority
    if (priority !== "low" && priority !== "medium" && priority !== "high") {
        return { ok: false, error: "priority должен быть 'low', 'medium' или 'high'" };
    }
    //Возврат результата при успехе
    return {
        ok: true,
        task: {
            id: id,
            title: trimmedTitle,
            completed: false,
            priority: priority
        }
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
// Внутренние функции-помощники для проверки данных
function isValidId(id) {
    return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

function validateAndTrimTitle(title) {
    if (typeof title !== 'string') return null;
    const trimmed = title.trim();
    return (trimmed.length >= 1 && trimmed.length <= 100) ? trimmed : null;
}

export function addTask(tasks, id, title, priority = "medium") {
    const newTaskResult = createTask(id, title, priority);
    if (!newTaskResult.ok) {
        return newTaskResult;
    }
    if (tasks.some(task => task.id === id)) {
        return { ok: false, error: "Задача с таким id уже существует" };
    }
    return { ok: true, tasks: [...tasks, newTaskResult.task] };
}

export function setTaskCompleted(tasks, id, completed) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    if (typeof completed !== 'boolean') {
        return { ok: false, error: "Статус должен быть логическим значением true или false" };
    }
    const taskExists = tasks.some(task => task.id === id);
    if (!taskExists) return { ok: false, error: "Задача не найдена" };
    const newTasks = tasks.map(task =>
        task.id === id ? { ...task, completed: completed } : task
    );
    return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    const trimmedTitle = validateAndTrimTitle(title);
    if (trimmedTitle === null) {
        return { ok: false, error: "Некорректное название задачи" };
    }
    const taskExists = tasks.some(task => task.id === id);
    if (!taskExists) return { ok: false, error: "Задача не найдена" };
    const newTasks = tasks.map(task =>
        task.id === id ? { ...task, title: trimmedTitle } : task
    );
    return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    const taskExists = tasks.some(task => task.id === id);
    if (!taskExists) return { ok: false, error: "Задача не найдена" };
    const newTasks = tasks.filter(task => task.id !== id);
    return { ok: true, tasks: newTasks };
}
import { demoTasks } from './data.js';
import {
    getTaskTitles, getPendingTasks, getTaskStats,
    addTask, setTaskCompleted, renameTask, removeTask
} from './task-service.js';

// Вспомогательная функция для вывода статистики
function printStats(tasks, stageName) {
    const { total, completed, pending, progress } = getTaskStats(tasks);
    console.log(`\n--- ${stageName} ---`);
    console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
    if (total === 0) {
        console.log("Задач пока нет");
    } else {
        console.log(`Прогресс: ${progress.toFixed(1)}%`);
    }
}

let currentTasks = demoTasks;
console.log("1. Исходные задачи:", currentTasks);
console.log("Названия:", getTaskTitles(currentTasks));
console.log("Невыполненные:", getPendingTasks(currentTasks));
printStats(currentTasks, "Исходный набор");

const step2 = addTask(currentTasks, 20, "Добавить проверку", "high");
if (step2.ok) currentTasks = step2.tasks;
else console.error(`Ошибка: ${step2.error}`);
printStats(currentTasks, "После добавления id = 20");

const step3 = setTaskCompleted(currentTasks, 4, true);
if (step3.ok) currentTasks = step3.tasks;
else console.error(`Ошибка: ${step3.error}`);
printStats(currentTasks, "После выполнения id = 4");

const step4 = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (step4.ok) currentTasks = step4.tasks;
else console.error(`Ошибка: ${step4.error}`);
printStats(currentTasks, "После переименования id = 10");

const step5 = removeTask(currentTasks, 7);
if (step5.ok) currentTasks = step5.tasks;
else console.error(`Ошибка: ${step5.error}`);
printStats(currentTasks, "После удаления id = 7");

console.log("\n6. Попытка добавить задачу с существующим id:");
const step6 = addTask(currentTasks, 20, "Дубликат");
if (step6.ok) {
    currentTasks = step6.tasks;
} else {
    console.log(`Ожидаемый отказ обработан: ${step6.error}`);
}

console.log("\n7. Исходный demoTasks остался неизменным?");
console.log(demoTasks.length === 4 && demoTasks[1].completed === false ? "Да, данные сохранены." : "Нет, массив мутировал!");
console.log("\nИтоговые ID задач:", currentTasks.map(t => t.id));