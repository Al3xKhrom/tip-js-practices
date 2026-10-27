const PRIORITIES = new Set(['low', 'medium', 'high']);

export function validateTaskDraft(draft, categories) {
  const errors = {};
  const input = draft && typeof draft === 'object' ? draft : {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (typeof input.title !== 'string' || title.length < 1 || title.length > 100) {
    errors.title = 'Название должно содержать от 1 до 100 символов.';
  }
  if (!PRIORITIES.has(input.priority)) {
    errors.priority = 'Выберите допустимый приоритет.';
  }
  const categoryId = typeof input.categoryId === 'string' && input.categoryId.trim() === ''
    ? NaN : Number(input.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !Array.isArray(categories)
    || !categories.some(category => category.id === categoryId)) {
    errors.categoryId = 'Выберите категорию из списка.';
  }
  return Object.keys(errors).length
    ? { valid: false, value: null, errors }
    : { valid: true, value: { title, priority: input.priority, categoryId }, errors: {} };
}