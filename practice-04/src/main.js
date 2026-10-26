import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { addTask, findTaskById, removeTask, setTaskCompleted, updateTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks } from "./task-storage.js";

// Элементы HTML-страницы
const elements = {
    list: document.querySelector("#task-list"),
    filters: document.querySelector("#task-filters"),
    summary: document.querySelector("#task-summary"),
    empty: document.querySelector("#empty-message"),
    message: document.querySelector("#operation-message"),
    datasetLabel: document.querySelector("#dataset-label"),
    storageStatus: document.querySelector("#storage-status"),
    form: document.querySelector("#task-form"),
    formHeading: document.querySelector("#form-heading"),
    formMode: document.querySelector("#form-mode"),
    formMessage: document.querySelector("#form-message"),
    idInput: document.querySelector("#task-id"),
    titleInput: document.querySelector("#task-title"),
    priorityInput: document.querySelector("#task-priority"),
    submitButton: document.querySelector("#form-submit"),
    cancelButton: document.querySelector("#cancel-edit"),
    resetButton: document.querySelector("#reset-data")
};

// Создаём кнопку очистки черновика
const clearDraftButton = document.createElement("button");
clearDraftButton.type = "button";
clearDraftButton.className = "button-secondary";
clearDraftButton.textContent = "Очистить черновик";
elements.form.querySelector(".form-actions").append(clearDraftButton);

// Определяем выбранный набор задач
const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";
const isCheckRun = params.get("mode") === "check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";

// Отдельный ключ для сохранённых задач
const storageKey = isCheckRun
    ? `tip-js-practice-04:checks:${datasetName}`
    : `tip-js-practice-04:${datasetName}`;

// Отдельный ключ для черновика формы
const draftKey = `tip-js-practice-04:draft:${datasetName}`;
const DRAFT_VERSION = 1;

// Загружаем задачи из localStorage
let loaded;
try {
    loaded = loadTasks(
        window.localStorage,
        storageKey,
        initialTasks
    );
} catch (error) {
    loaded = {
        ok: false,
        source: "fallback",
        tasks: initialTasks.map(task => ({ ...task })),
        error: `Ошибка загрузки: ${error.message}`
    };
    console.error(error);
}

// Состояние приложения
let currentTasks = loaded.tasks;
let currentFilter = "all";
let editingId = null;

// Отображаем название набора
elements.datasetLabel.textContent = isVariant
    ? `Индивидуальный вариант: ${variantNumber}`
    : "Общий контрольный набор";

// Отображаем состояние хранилища
if (loaded.source === "storage") {
    elements.storageStatus.textContent =
        "Данные восстановлены из localStorage.";
} else if (loaded.ok) {
    elements.storageStatus.textContent =
        "Используется исходный набор; сохранённых данных пока нет.";
} else {
    elements.storageStatus.textContent = loaded.error;
    elements.storageStatus.classList.add("is-warning");
}

// Перерисовка приложения
function renderApp() {
    const visibleTasks = getVisibleTasks(
        currentTasks,
        currentFilter
    );
    renderTaskList(elements.list, visibleTasks);
    renderSummary(
        elements.summary,
        currentTasks,
        visibleTasks.length
    );
    renderEmptyState(
        elements.empty,
        currentTasks.length,
        visibleTasks.length
    );
    const buttons = elements.filters.querySelectorAll(
        "button[data-filter]"
    );
    for (const button of buttons) {
        const active = button.dataset.filter === currentFilter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
    }
}

// Очищаем ошибку одного поля
function clearFieldError(name) {
    const input = elements.form.elements.namedItem(name);
    const message = elements.form.querySelector(
        `[data-error-for="${name}"]`
    );
    if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLSelectElement
    ) {
        input.setCustomValidity("");
        input.removeAttribute("aria-invalid");
    }
    if (message) {
        message.textContent = "";
    }
}

// Очищаем все ошибки
function clearFormErrors() {
    for (const name of ["id", "title", "priority"]) {
        clearFieldError(name);
    }
    elements.formMessage.textContent = "";
}

// Показываем ошибки формы
function showFormErrors(errors) {
    clearFormErrors();
    for (const [name, text] of Object.entries(errors)) {
        const input = elements.form.elements.namedItem(name);
        const message = elements.form.querySelector(
            `[data-error-for="${name}"]`
        );
        if (
            input instanceof HTMLInputElement ||
            input instanceof HTMLSelectElement
        ) {
            input.setCustomValidity(text);
            input.setAttribute("aria-invalid", "true");
        }
        if (message) {
            message.textContent = text;
        }
    }
    elements.form.reportValidity();
}

// Получаем текущие значения полей
function readDraftFields() {
    return {
        id: elements.idInput.value,
        title: elements.titleInput.value,
        priority: elements.priorityInput.value
    };
}

// Удаляем сохранённый черновик
function removeFormDraft() {
    if (isCheckRun) {
        return { ok: true };
    }
    try {
        window.localStorage.removeItem(draftKey);
        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            error: `Не удалось удалить черновик: ${error.message}`
        };
    }
}

// Автоматическое сохранение черновика
function saveFormDraft() {
    // Черновик сохраняется только в режиме создания
    if (editingId !== null || isCheckRun) {
        return;
    }
    const fields = readDraftFields();
    const isEmpty =
        fields.id === "" &&
        fields.title === "" &&
        fields.priority === "medium";
    if (isEmpty) {
        const result = removeFormDraft();
        if (!result.ok) {
            elements.formMessage.textContent = result.error;
        }
        return;
    }
    try {
        const draft = {
            version: DRAFT_VERSION,
            fields: fields
        };
        window.localStorage.setItem(
            draftKey,
            JSON.stringify(draft)
        );
    } catch (error) {
        elements.formMessage.textContent =
            `Не удалось сохранить черновик: ${error.message}`;
    }
}

// Чтение сохранённого черновика
function loadFormDraft() {
    if (isCheckRun) {
        return { ok: true, fields: null };
    }
    try {
        const raw = window.localStorage.getItem(draftKey);
        if (raw === null) {
            return {
                ok: true,
                fields: null
            };
        }
        const saved = JSON.parse(raw);
        const fields = saved?.fields;
        const valid =
            saved?.version === DRAFT_VERSION &&
            fields !== null &&
            typeof fields === "object" &&
            !Array.isArray(fields) &&
            typeof fields.id === "string" &&
            typeof fields.title === "string" &&
            ["low", "medium", "high"].includes(fields.priority);
        if (!valid) {
            throw new Error("Неправильная схема черновика");
        }
        return {
            ok: true,
            fields: fields
        };
    } catch (error) {
        removeFormDraft();
        return {
            ok: false,
            fields: null,
            error: `Черновик повреждён и проигнорирован: ${error.message}`
        };
    }
}

// Восстанавливаем поля после перезагрузки
function restoreFormDraft() {
    const saved = loadFormDraft();
    if (!saved.ok) {
        elements.formMessage.textContent = saved.error;
        return;
    }
    if (saved.fields) {
        elements.idInput.value = saved.fields.id;
        elements.titleInput.value = saved.fields.title;
        elements.priorityInput.value = saved.fields.priority;
        elements.formMessage.textContent =
            "Черновик формы восстановлен.";
    }
}

function setFormMode(id = null, restoreDraft = true) {
    if (id === null) {
        editingId = null;
        elements.form.reset();
        clearFormErrors();
        elements.idInput.disabled = false;
        elements.formHeading.textContent = "Добавление задачи";
        elements.formMode.textContent =
            "Режим создания новой задачи.";
        elements.submitButton.textContent = "Добавить задачу";
        elements.cancelButton.hidden = true;
        clearDraftButton.hidden = false;
        elements.idInput.focus();
        if (restoreDraft) {
            restoreFormDraft();
        }
        return true;
    }

    // Режим редактирования
    const task = findTaskById(currentTasks, id);
    if (!task) {
        elements.formMessage.textContent =
            `Задача с ID ${id} не найдена.`;
        return false;
    }
    clearFormErrors();
    editingId = id;
    elements.idInput.value = String(task.id);
    elements.titleInput.value = task.title;
    elements.priorityInput.value = task.priority;
    elements.idInput.disabled = true;
    elements.formHeading.textContent = "Редактирование задачи";
    elements.formMode.textContent =
        `Редактируется задача №${id}.`;
    elements.submitButton.textContent = "Сохранить изменения";
    elements.cancelButton.hidden = false;
    clearDraftButton.hidden = true;
    elements.titleInput.focus();
    return true;
}

// Сохранение списка задач
function persistCurrentTasks(successMessage) {
    const saved = saveTasks(
        window.localStorage,
        storageKey,
        currentTasks
    );
    elements.storageStatus.classList.toggle(
        "is-warning",
        !saved.ok
    );
    elements.storageStatus.textContent = saved.ok
        ? "Изменения сохранены в localStorage."
        : saved.error;
    elements.message.textContent = saved.ok
        ? successMessage
        : `${successMessage} ${saved.error}`;
    renderApp();
    return saved;
}

// Восстановление фокуса
function restoreTaskFocus(id, action) {
    const actionButton = elements.list.querySelector(
        `[data-task-id="${id}"] button[data-action="${action}"]`
    );
    const filterButton = elements.filters.querySelector(
        `[data-filter="${currentFilter}"]`
    );
    if (actionButton) {
        actionButton.focus();
    } else if (filterButton) {
        filterButton.focus();
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(elements.form);
    const draft = {
        id: formData.get("id"),
        title: formData.get("title"),
        priority: formData.get("priority")
    };
    const validation = validateTaskDraft(
        draft,
        currentTasks,
        editingId
    );
    if (!validation.ok) {
        showFormErrors(validation.errors);
        return;
    }
    const { id, title, priority } = validation.value;
    const wasEditing = editingId !== null;
    let result;
    if (wasEditing) {
        result = updateTask(
            currentTasks,
            editingId,
            title,
            priority
        );
    } else {
        result = addTask(
            currentTasks,
            id,
            title,
            priority
        );
    }
    if (!result.ok) {
        elements.formMessage.textContent = result.error;
        return;
    }
    // Принимаем новый массив задач
    currentTasks = result.tasks;
    if (wasEditing) {
        setFormMode();
    } else {
        const cleared = removeFormDraft();
        setFormMode(null, false);
        if (!cleared.ok) {
            elements.formMessage.textContent = cleared.error;
        }
    }
    persistCurrentTasks(
        wasEditing ? "Задача изменена." : "Задача добавлена."
    );
}

function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) {
        return;
    }
    const button = event.target.closest("button[data-action]");
    if (!button || !elements.list.contains(button)) {
        return;
    }
    const action = button.dataset.action;
    if (!["edit", "toggle", "delete"].includes(action)) {
        return;
    }
    const card = button.closest("li[data-task-id]");
    if (!card) {
        return;
    }
    const id = Number(card.dataset.taskId);
    if (!Number.isSafeInteger(id) || id <= 0) {
        elements.message.textContent = "Некорректный ID задачи.";
        return;
    }
    const task = findTaskById(currentTasks, id);
    if (!task) {
        elements.message.textContent = "Задача не найдена.";
        return;
    }
    // Нажатие "Изменить"
    if (action === "edit") {
        setFormMode(id);
        return;
    }
    let result;
    // Изменение статуса
    if (action === "toggle") {
        result = setTaskCompleted(
            currentTasks,
            id,
            !task.completed
        );
    }
    // Удаление
    if (action === "delete") {
        result = removeTask(currentTasks, id);
    }
    if (!result.ok) {
        elements.message.textContent = result.error;
        return;
    }
    currentTasks = result.tasks;
    if (action === "delete" && editingId === id) {
        setFormMode();
    }
    persistCurrentTasks(
        action === "toggle"
            ? "Статус изменён."
            : "Задача удалена."
    );
    restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
    if (!(event.target instanceof Element)) {
        return;
    }
    const button = event.target.closest("button[data-filter]");
    if (!button || !elements.filters.contains(button)) {
        return;
    }
    const filter = button.dataset.filter;
    if (!["all", "pending", "completed"].includes(filter)) {
        return;
    }
    currentFilter = filter;
    renderApp();
}

function handleResetClick() {
    const removed = removeSavedTasks(
        window.localStorage,
        storageKey
    );
    if (!removed.ok) {
        elements.storageStatus.classList.add("is-warning");
        elements.storageStatus.textContent = removed.error;
        elements.message.textContent =
            "Не удалось удалить сохранённые данные.";
        return;
    }
    const draftRemoved = removeFormDraft();
    currentTasks = initialTasks.map(task => ({ ...task }));
    currentFilter = "all";
    setFormMode(null, false);
    if (!draftRemoved.ok) {
        elements.formMessage.textContent = draftRemoved.error;
    }
    elements.storageStatus.classList.remove("is-warning");
    elements.storageStatus.textContent =
        "Используется исходный набор; сохранённых данных пока нет.";
    elements.message.textContent = "Исходный список восстановлен.";
    renderApp();
}

// Отправка формы
elements.form.addEventListener("submit", handleFormSubmit);

// Автосохранение черновика при вводе
elements.form.addEventListener("input", (event) => {
    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
    ) {
        clearFieldError(event.target.name);
        if (["id", "title", "priority"].includes(event.target.name)) {
            saveFormDraft();
        }
    }
});

// Сохраняем выбор приоритета
elements.priorityInput.addEventListener("change", saveFormDraft);

// Кнопка очистки черновика
clearDraftButton.addEventListener("click", () => {
    if (editingId !== null) {
        return;
    }
    const removed = removeFormDraft();
    if (!removed.ok) {
        elements.formMessage.textContent = removed.error;
        return;
    }
    // Очищаем поля и не восстанавливаем черновик
    setFormMode(null, false);
    elements.formMessage.textContent = "Черновик очищен.";
});

// Кнопки карточек
elements.list.addEventListener(
    "click",
    handleTaskListClick
);

// Фильтры
elements.filters.addEventListener(
    "click",
    handleFilterClick
);

// Отмена редактирования
elements.cancelButton.addEventListener("click", () => {
    setFormMode();
});

// Сброс сохранённых данных
elements.resetButton.addEventListener(
    "click",
    handleResetClick
);

try {
    setFormMode();
    renderApp();
} catch (error) {
    elements.message.textContent =
        `Ошибка запуска: ${error.message}`;
    console.error(error);
}