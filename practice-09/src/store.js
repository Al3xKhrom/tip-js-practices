import { categories as seedCategories, tasks as seedTasks } from './data.js';
import { selectTasks, findTask } from './task-service.js';

// Для каждого приложения собственные копии данных, без открытия порта.
export function createStore() {
  const tasks = seedTasks.map(task => ({ ...task }));
  const categories = seedCategories.map(category => ({ ...category }));
  return {
    listTasks: filters => selectTasks(tasks, filters),
    getTask: id => findTask(tasks, id),
    listCategories: () => categories.map(category => ({ ...category })),
    // Используется только в отдельном режиме КР3, ПР9 остаётся read-only.
    createTask: value => {
      const id = Math.max(0, ...tasks.map(task => task.id)) + 1;
      const task = { id, ...value, completed: false };
      tasks.push(task);
      return { ...task };
    },
  };
}
