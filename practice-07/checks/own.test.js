import test from 'node:test';
import assert from 'node:assert/strict';
import { tasks, categories } from '../src/data.js';
import { createInitialFilters, variant } from '../src/variant.js';
import { addTask, getTaskStats, removeTask, selectTasks, sortTasks, toggleTask, updateTask, validateTaskDraft } from '../src/domain/task-service.js';

test('вариант 5: изначально выбрана категория «Учёба»', () => {
  assert.equal(variant, 5);
  assert.deepEqual(createInitialFilters(), { q: '', completed: '', priority: '', categoryId: '1' });
  assert.deepEqual(selectTasks(tasks, createInitialFilters()).map(task => task.id), [1, 7, 13]);
});

test('вариант 5: перенос из категории 1 в 2 скрывает карточку, не меняя общую статистику', () => {
  const before = getTaskStats(tasks);
  const draft = validateTaskDraft({ title: tasks[0].title, priority: tasks[0].priority, categoryId: '2' }, categories);
  assert.equal(draft.valid, true);
  const after = updateTask(tasks, 1, draft.value);
  assert.deepEqual(selectTasks(after, createInitialFilters()).map(task => task.id), [7, 13]);
  assert.equal(after.find(task => task.id === 1).categoryId, 2);
  assert.deepEqual(getTaskStats(after), before);
  assert.equal(tasks[0].categoryId, 1);
});

test('дополнение: сортировка по названию не меняет исходный массив', () => {
  const source = Object.freeze(tasks.slice());
  const sorted = sortTasks(source, 'title');
  assert.notEqual(sorted, source);
  assert.deepEqual(sorted.map(task => task.title), [...source].map(task => task.title).sort((a,b) => a.localeCompare(b, 'ru')));
  assert.deepEqual(source.map(task => task.id), tasks.map(task => task.id));
});

test('дополнение: сортировка по приоритету стабильна, высокий сначала', () => {
  const sorted = sortTasks(tasks, 'priority');
  assert.deepEqual(sorted.map(task => task.priority), [...Array(5).fill('high'), ...Array(4).fill('medium'), ...Array(3).fill('low')]);
  assert.deepEqual(sorted.filter(task => task.priority === 'high').map(task => task.id), [4, 13, 16, 25, 34]);
});

test('дополнение: создание → редактирование → переключение → удаление без мутаций', () => {
  const initial = JSON.stringify(tasks);
  const value = validateTaskDraft({ title: '  Новая  ', priority: 'medium', categoryId: '3' }, categories).value;
  const created = addTask(tasks, value, 35);
  const edited = updateTask(created, 35, { ...value, title: 'Отредактирована', categoryId: 2 });
  const toggled = toggleTask(edited, 35);
  const removed = removeTask(toggled, 35);
  assert.equal(created.at(-1).title, 'Новая');
  assert.equal(edited.at(-1).title, 'Отредактирована');
  assert.equal(toggled.at(-1).completed, true);
  assert.deepEqual(removed, tasks);
  assert.equal(JSON.stringify(tasks), initial);
});
