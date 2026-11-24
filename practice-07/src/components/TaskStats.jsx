export default function TaskStats({ stats }) {
  return (
    <section className="stats-section" aria-label="Статистика">
      <h2 className="visually-hidden">Общая статистика</h2>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-label">Всего задач</span><strong className="stat-number">{stats.total}</strong></div>
        <div className="stat-card"><span className="stat-label">Выполнено</span><strong className="stat-number stat-done">{stats.completed}</strong></div>
        <div className="stat-card"><span className="stat-label">В работе</span><strong className="stat-number stat-active">{stats.active}</strong></div>
      </div>
    </section>
  );
}
