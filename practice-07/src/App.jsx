import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters, variant } from './variant.js';
import { addTask, getTaskStats, removeTask, selectTasks, sortTasks, toggleTask, updateTask } from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const [sortMode, setSortMode] = useState('default');
  const [announcement, setAnnouncement] = useState('');

  // Производные данные не дублируются в useState и всегда актуальны.
  const visibleTasks = selectTasks(tasks, filters);
  const displayedTasks = sortTasks(visibleTasks, sortMode);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;

  function handleSave(value) {
    if (editingId !== null) {
      if (!tasks.some(task => task.id === editingId)) return false;
      setTasks(previous => updateTask(previous, editingId, value));
      setEditingId(null);
      setAnnouncement('Изменения задачи сохранены. Если запись скрыта фильтром, сбросьте фильтры.');
      return true;
    }
    // Выбор ID внутри чистого updater по полному актуальному списку.
    setTasks(previous => {
      const nextId = Math.max(0, ...previous.map(task => task.id)) + 1;
      return addTask(previous, value, nextId);
    });
    setAnnouncement('Новая задача создана. Если она не видна, проверьте активные фильтры.');
    return true;
  }

  function handleToggle(id) {
    setTasks(previous => toggleTask(previous, id));
    setAnnouncement('Статус задачи изменён. Список и общая статистика обновлены.');
  }

  function handleDelete(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    // Побочный эффект находится ДО updater: безопасно в React StrictMode.
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
    setAnnouncement('Задача удалена.');
  }

  function handleStartEditing(id) {
    setEditingId(id);
    setAnnouncement(`Редактирование задачи №${id}.`);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">Технологии индустриального программирования · Практика 7</span>
          <h1>Планировщик задач</h1>
          <p>Управляйте учебными и проектными задачами с помощью React.</p>
        </div>
        <div className="hero-marker">Вариант <strong>№{variant}</strong></div>
      </header>
      <div className="notice" role="note">
        <strong>Учебный режим.</strong> Задачи хранятся в памяти этой страницы. После перезагрузки вернутся исходные 12 задач и фильтр категории «Учёба».
      </div>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      {announcement && <p className="global-message" role="status">{announcement}</p>}
      <div className="content-grid">
        <div className="form-column">
          <TaskForm key={editingId ?? 'new'} categories={categories} initialTask={editingTask} onSave={handleSave}
            onCancel={() => { setEditingId(null); setAnnouncement('Редактирование отменено, данные не изменились.'); }} />
          <aside className="hint-card">
            <h2>Сценарий варианта №5</h2>
            <p>При фильтре «Учёба» откройте редактирование любой видимой задачи, поменяйте категорию на «Проект» и сохраните.</p>
            <p>Задача исчезнет из выборки, но останется в общем наборе. Сбросьте фильтры, чтобы увидеть её снова.</p>
          </aside>
        </div>
        <TaskList tasks={displayedTasks} categories={categories} totalCount={tasks.length} sortMode={sortMode} onSortChange={setSortMode}
          onToggle={handleToggle} onEdit={handleStartEditing} onDelete={handleDelete} />
      </div>
      <footer className="app-footer">React · Vite · useState · данные в памяти · ПР7</footer>
    </main>
  );
}