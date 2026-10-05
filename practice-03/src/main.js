import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";
const elements = {
    list: document.querySelector("#task-list"),
    filters: document.querySelector("#task-filters"),
    summary: document.querySelector("#task-summary"),
    empty: document.querySelector("#empty-message"),
    message: document.querySelector("#operation-message"),
    datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
// Наборы не смешиваются, редактировать код для переключения не требуется.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";
elements.datasetLabel.textContent = isVariant
    ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
    : "Общий контрольный набор";

// Переменная для хранения текущего фильтра (где-то рядом с let currentTasks = demoTasks)
let currentFilter = 'all';
let currentPriorityFilter = 'all';
// Централизованная функция перерисовки интерфейса
function renderApp() {
    const visibleTasks = getVisibleTasks(currentTasks, currentFilter, currentPriorityFilter);
    renderTaskList(listElement, visibleTasks);
    renderSummary(summaryElement, currentTasks, visibleTasks.length);
    renderEmptyState(emptyMessageElement, currentTasks.length, visibleTasks.length);
}

function handlePriorityFilterClick(event) {
    const button = event.target.closest('button');
    if (!button || !button.dataset.priority) return;
    const filterContainer = event.currentTarget;
    const allButtons = filterContainer.querySelectorAll('button');
    allButtons.forEach(btn => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
    currentPriorityFilter = button.dataset.priority;
    renderApp();
}

function handleFilterClick(event) {
    const button = event.target.closest('button');
    if (!button || !button.dataset.value) return;
    const filterContainer = event.currentTarget;
    const allButtons = filterContainer.querySelectorAll('button');
    allButtons.forEach(btn => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
    currentFilter = button.dataset.value;
    renderApp();
}

// Обработчик кликов по списку задач
function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-action]');
    if (!button || !event.currentTarget.contains(button)) return;
    const action = button.dataset.action;
    if (action !== 'toggle' && action !== 'delete') return;
    const card = button.closest('li[data-task-id]');
    if (!card) return;
    const id = Number(card.dataset.taskId);
    if (!Number.isSafeInteger(id) || id <= 0) {
        console.error("Ошибка: Некорректный идентификатор задачи.");
        return;
    }
    let result;
    if (action === 'toggle') {
        const task = findTaskById(currentTasks, id);
        if (!task) {
            console.error("Ошибка: Задача не найдена.");
            return;
        }
        result = setTaskCompleted(currentTasks, id, !task.completed);
    } else if (action === 'delete') {
        result = removeTask(currentTasks, id);
    }
    if (!result.ok) {
        console.error(result.error);
    } else {
        currentTasks = result.tasks;
        console.log("Успех. Ошибок нет.");
        if (typeof restoreTaskFocus === 'function') {
            restoreTaskFocus(id, action);
        }
    }
}

// Готовая вспомогательная функция. Сохраняет понятную позицию клавиатурного фокуса
// после замены карточек. Если карточки больше нет, фокус получает активный фильтр.
function restoreTaskFocus(id, action) {
    const actionButton = elements.list.querySelector(
        `[data-task-id="${id}"] button[data-action="${action}"]`,
    );
    const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
    (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);

// До реализации renderApp ожидается сообщение о заглушке.
// try/catch здесь — готовая диагностика старта, а не замена проверки result.ok.
try {
    renderApp();
} catch (error) {
    elements.message.textContent = `Ошибка запуска: ${error.message}`;
    console.error(error);
}