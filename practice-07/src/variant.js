// Индивидуальный вариант №5: начальный фильтр — категория «Учёба» (id=1).
export const variant = 5;
export function createInitialFilters() {
  const presets = [
    { completed: 'false' }, { completed: 'true' },
    { priority: 'high' }, { priority: 'medium' },
    { categoryId: '1' }, { categoryId: '2' },
    { q: 'провер' }, { completed: 'false', priority: 'high', categoryId: '2' },
  ];
  return { q: '', completed: '', priority: '', categoryId: '', ...presets[((variant - 1) % 8 + 8) % 8] };
}
