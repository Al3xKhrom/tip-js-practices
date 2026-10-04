import { searchTasks } from './task-extra.js';
import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
    createTask,
    findTaskById,
    getPendingTasks,
    getTaskTitles,
    getTaskStats,
    addTask,
    setTaskCompleted,
    renameTask,
    removeTask,
} from "./task-service.js";
console.log("ПР2. Заготовка демонстрационного сценария");
console.log("Количество задач в общем наборе:", demoTasks.length);
console.log("Номер варианта:", variantNumber);
console.log("Количество задач в индивидуальном наборе:", variantTasks.length);

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
console.log("\n\n=== ОБЩИЙ СЦЕНАРИЙ (demoTasks) ===");

let currentTasks = demoTasks;
console.log("\n1. Исходные задачи:");
console.table(currentTasks);
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
console.log("\n6. Попытка добавить задачу с существующим id = 20:");
const step6 = addTask(currentTasks, 20, "Задвоившаяся задача");
if (step6.ok) {
    currentTasks = step6.tasks;
} else {
    console.log(`Ожидаемый отказ обработан: ${step6.error}`);
}
console.log("\n7. Исходный demoTasks остался неизменным?");
console.log(demoTasks.length === 4 && demoTasks[1].completed === false ? "Да, данные сохранены (мутаций нет)." : "Нет, массив мутировал!");
console.log("\n--- СОБСТВЕННЫЕ ПРОВЕРКИ ---");
const check1 = removeTask(currentTasks, 999);
console.log("Удаление id=999:", check1.ok ? "Успех" : `Отказ (${check1.error})`);
const check2 = setTaskCompleted(currentTasks, 4, true);
if (check2.ok) currentTasks = check2.tasks;
console.log("Повторное выполнение id=4:", check2.ok ? "Успешно отработало без мутаций" : "Ошибка");
let check3 = addTask(currentTasks, 50, "Временная", "low");
if (check3.ok) check3 = removeTask(check3.tasks, 50);
if (check3.ok) currentTasks = check3.tasks;
console.log("Добавление и удаление id=50:", check3.ok ? "Успешно, вернулись к исходному состоянию" : "Ошибка");
console.log("\n\n=== ИНДИВИДУАЛЬНЫЙ СЦЕНАРИЙ (ВАРИАНТ 5) ===");

let currentVariantTasks = variantTasks;
console.log("\n1. Исходные данные (Вариант 5):");
console.table(currentVariantTasks);
printStats(currentVariantTasks, "Исходный набор варианта 5");
const varStep2 = addTask(currentVariantTasks, 80, "Провести код-ревью", "medium");
if (varStep2.ok) currentVariantTasks = varStep2.tasks;
else console.error(`Ошибка: ${varStep2.error}`);
printStats(currentVariantTasks, "После добавления id = 80");
const varStep3 = setTaskCompleted(currentVariantTasks, 11, true);
if (varStep3.ok) currentVariantTasks = varStep3.tasks;
else console.error(`Ошибка: ${varStep3.error}`);
printStats(currentVariantTasks, "После обновления id = 11");
const varStep4 = renameTask(currentVariantTasks, 23, "Провести установочный митинг");
if (varStep4.ok) currentVariantTasks = varStep4.tasks;
else console.error(`Ошибка: ${varStep4.error}`);
printStats(currentVariantTasks, "После переименования id = 23");
const varStep5 = removeTask(currentVariantTasks, 37);
if (varStep5.ok) currentVariantTasks = varStep5.tasks;
else console.error(`Ошибка: ${varStep5.error}`);
printStats(currentVariantTasks, "После удаления id = 37");
console.log("\n6. Попытка повторно добавить id = 80:");
const varStep6 = addTask(currentVariantTasks, 80, "Слияние веток", "high");
if (varStep6.ok) {
    currentVariantTasks = varStep6.tasks;
} else {
    console.log(`Ожидаемый отказ обработан: ${varStep6.error}`);
}
console.log("\n7. Итоговые задачи варианта:");
console.table(currentVariantTasks);
console.log("Исходный variantTasks сохранен?", variantTasks.length === 6 ? "Да, массив не поврежден." : "Нет!");

console.log("\n\n=== ДОПОЛНИТЕЛЬНОЕ ЗАДАНИЕ (ПОИСК) ===");
const searchDemoTasks = demoTasks;
console.log("\nПоиск 'функ' (разный регистр):");
console.table(searchTasks(searchDemoTasks, "ФУНК"));
console.log("\nПоиск '  модель  ' (краевые пробелы):");
console.table(searchTasks(searchDemoTasks, "  модель  "));
console.log("\nПоиск 'несуществующий фрагмент':");
console.table(searchTasks(searchDemoTasks, "несуществующий фрагмент"));
console.log("\nПоиск пустой строки '   ':");
const emptyQueryResult = searchTasks(searchDemoTasks, "   ");
console.log(`Найдено задач: ${emptyQueryResult.length} (ожидается ${searchDemoTasks.length})`);
console.log("\nПоиск в пустом списке:");
console.table(searchTasks([], "проверка"));
console.log("\nИсходный список остался неизменным?");
console.log(searchDemoTasks === demoTasks ? "Да, мутаций исходной ссылки нет." : "Нет!");