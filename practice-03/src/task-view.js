import { getTaskStats } from "./task-service.js";

export function createTaskElement(task) {
    const li = document.createElement('li');
    li.classList.add('task-card');
    li.dataset.taskId = task.id;
    if (task.completed) {
        li.classList.add('is-completed');
    }
    const titleEl = document.createElement('h3');
    titleEl.classList.add('task-title');
    titleEl.textContent = task.title;
    const statusEl = document.createElement('span');
    statusEl.classList.add('task-status');
    statusEl.textContent = task.completed ? 'Выполнена' : 'В работе';
    const priorityEl = document.createElement('span');
    priorityEl.classList.add('task-priority');
    const priorityMap = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
    priorityEl.textContent = priorityMap[task.priority] || task.priority;
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.dataset.action = 'toggle';
    toggleBtn.setAttribute('aria-pressed', task.completed ? 'true' : 'false');
    const toggleLabel = document.createElement('span');
    toggleLabel.classList.add('action-label');
    toggleLabel.textContent = 'Выполнена';
    toggleBtn.appendChild(toggleLabel);
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.dataset.action = 'delete';
    const deleteLabel = document.createElement('span');
    deleteLabel.classList.add('action-label');
    deleteLabel.textContent = 'Удалить';
    deleteBtn.appendChild(deleteLabel);
    actionsDiv.appendChild(toggleBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(titleEl);
    li.appendChild(statusEl);
    li.appendChild(priorityEl);
    li.appendChild(actionsDiv);
    return li;
}

export function renderTaskList(listElement, tasks) {
    const taskElements = tasks.map(task => createTaskElement(task));
    listElement.replaceChildren(...taskElements);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
    const stats = getTaskStats(tasks);
    const statNodes = {
        total: summaryElement.querySelector('[data-stat="total"]'),
        completed: summaryElement.querySelector('[data-stat="completed"]'),
        pending: summaryElement.querySelector('[data-stat="pending"]'),
        progress: summaryElement.querySelector('[data-stat="progress"]'),
        visible: summaryElement.querySelector('[data-stat="visible"]')
    };
    if (statNodes.total) statNodes.total.textContent = stats.total;
    if (statNodes.completed) statNodes.completed.textContent = stats.completed;
    if (statNodes.pending) statNodes.pending.textContent = stats.pending;
    if (statNodes.visible) statNodes.visible.textContent = visibleCount;
    if (statNodes.progress) {
        statNodes.progress.textContent = stats.total === 0 ? "0.0%" : `${stats.progress.toFixed(1)}%`;
    }
}

export function renderEmptyState(messageElement, total, visibleCount) {
    if (total === 0 && visibleCount === 0) {
        messageElement.textContent = "Список задач пуст.";
        messageElement.hidden = false;
    } else if (total > 0 && visibleCount === 0) {
        messageElement.textContent = "Нет задач по выбранному фильтру.";
        messageElement.hidden = false;
    } else {
        messageElement.textContent = "";
        messageElement.hidden = true;
    }
}