import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
    list: document.querySelector("#task-list"),
    filters: document.querySelector("#task-filters"),
    priorityFilters: document.querySelector("#priority-filters"),
    summary: document.querySelector("#task-summary"),
    empty: document.querySelector("#empty-message"),
    message: document.querySelector("#operation-message"),
    datasetLabel: document.querySelector("#dataset-label"),
};

const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));

let currentFilter = "all";
let currentPriorityFilter = "all";

elements.datasetLabel.textContent = isVariant
    ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
    : "Общий контрольный набор";

function renderApp() {
    const visibleTasks = getVisibleTasks(currentTasks, currentFilter, currentPriorityFilter);
    renderTaskList(elements.list, visibleTasks);
    renderSummary(elements.summary, currentTasks, visibleTasks.length);
    renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);
}

function handlePriorityFilterClick(event) {
    const button = event.target.closest('button');
    if (!button || !button.dataset.priority) return;
    const allButtons = elements.priorityFilters.querySelectorAll('button');
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
    if (!button || !button.dataset.filter) return;

    const allButtons = elements.filters.querySelectorAll('button');
    allButtons.forEach(btn => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
    currentFilter = button.dataset.filter;
    renderApp();
}

function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-action]');
    if (!button || !event.currentTarget.contains(button)) return;

    const action = button.dataset.action;
    if (action !== 'toggle' && action !== 'delete') return;

    const card = button.closest('li[data-task-id]');
    if (!card) return;

    const id = Number(card.dataset.taskId);
    if (!Number.isSafeInteger(id) || id <= 0) return;

    let result;
    if (action === 'toggle') {
        const task = findTaskById(currentTasks, id);
        if (!task) return;
        result = setTaskCompleted(currentTasks, id, !task.completed);
    } else if (action === 'delete') {
        result = removeTask(currentTasks, id);
    }

    if (result && result.ok) {
        currentTasks = result.tasks;
        renderApp();
        if (typeof restoreTaskFocus === 'function') {
            restoreTaskFocus(id, action);
        }
    }
}

function restoreTaskFocus(id, action) {
    const actionButton = elements.list.querySelector(`[data-task-id="${id}"] button[data-action="${action}"]`);
    const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
    (actionButton ?? filterButton)?.focus();
}

// Защищенное добавление обработчиков событий (ошибки null больше не будет)
if (elements.list) elements.list.addEventListener("click", handleTaskListClick);
if (elements.filters) elements.filters.addEventListener("click", handleFilterClick);
if (elements.priorityFilters) elements.priorityFilters.addEventListener("click", handlePriorityFilterClick);

try {
    renderApp();
} catch (error) {
    if (elements.message) elements.message.textContent = `Ошибка запуска: ${error.message}`;
    console.error(error);
}