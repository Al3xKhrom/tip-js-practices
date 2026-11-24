const emptyFilters = { q: '', completed: '', priority: '', categoryId: '' };

export default function TaskFilters({ filters, categories, onChange }) {
  const changeField = (field, value) => onChange({ ...filters, [field]: value });
  const isFiltered = Object.values(filters).some(value => value !== '');

  return (
    <section className="panel filters-panel" aria-label="Фильтры">
      <div className="panel-heading">
        <div><span className="eyebrow">Поиск и выборка</span><h2>Фильтры</h2></div>
        <button className="button button-ghost" type="button" onClick={() => onChange({ ...emptyFilters })} disabled={!isFiltered}>
          Сбросить всё
        </button>
      </div>
      <div className="filters-grid">
        <div className="field field-search">
          <label htmlFor="task-search">Поиск по названию</label>
          <input id="task-search" type="search" placeholder="Например, проверить" value={filters.q} onChange={e => changeField('q', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="filter-completed">Статус</label>
          <select id="filter-completed" value={filters.completed} onChange={e => changeField('completed', e.target.value)}>
            <option value="">Все статусы</option><option value="false">В работе</option><option value="true">Выполнена</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-priority">Приоритет</label>
          <select id="filter-priority" value={filters.priority} onChange={e => changeField('priority', e.target.value)}>
            <option value="">Все приоритеты</option><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-category">Категория</label>
          <select id="filter-category" value={filters.categoryId} onChange={e => changeField('categoryId', e.target.value)}>
            <option value="">Все категории</option>
            {categories.map(category => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
          </select>
        </div>
      </div>
    </section>
  );
}
