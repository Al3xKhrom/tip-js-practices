import { useId, useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function createDraft(initialTask, categories) {
  return initialTask
    ? { title: initialTask.title, priority: initialTask.priority, categoryId: String(initialTask.categoryId) }
    : { title: '', priority: 'medium', categoryId: categories.length ? String(categories[0].id) : '' };
}

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createDraft(initialTask, categories));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const idPrefix = useId().replace(/:/g, '');
  const editing = initialTask !== null;

  const updateField = (name, value) => {
    setDraft(previous => ({ ...previous, [name]: value }));
    setErrors(previous => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
    setMessage('');
  };

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) { setMessage(''); return; }

    if (!onSave(result.value)) {
      setMessage('Не удалось сохранить задачу. Проверьте, что она существует, и повторите действие.');
      return;
    }
    if (!editing) {
      setDraft(createDraft(null, categories));
      setErrors({});
      setMessage('Задача успешно добавлена.');
    }
  }

  return (
    <section className="panel form-panel" aria-label="Форма задачи">
      <div className="panel-heading">
        <div><span className="eyebrow">{editing ? `Задача №${initialTask.id}` : 'Добавление'}</span><h2>{editing ? 'Редактировать задачу' : 'Новая задача'}</h2></div>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${idPrefix}-title`}>Название задачи <span aria-hidden="true">*</span></label>
          <input id={`${idPrefix}-title`} name="title" value={draft.title} onChange={e => updateField('title', e.target.value)}
            placeholder="Что нужно сделать?" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${idPrefix}-title-error` : `${idPrefix}-title-hint`} />
          {errors.title
            ? <span className="field-error" id={`${idPrefix}-title-error`} role="alert">{errors.title}</span>
            : <small className="field-hint" id={`${idPrefix}-title-hint`}>От 1 до 100 символов после удаления краевых пробелов.</small>}
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-priority`}>Приоритет</label>
          <select id={`${idPrefix}-priority`} name="priority" value={draft.priority} onChange={e => updateField('priority', e.target.value)}
            aria-invalid={Boolean(errors.priority)} aria-describedby={errors.priority ? `${idPrefix}-priority-error` : undefined}>
            <option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
          </select>
          {errors.priority && <span className="field-error" id={`${idPrefix}-priority-error`} role="alert">{errors.priority}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-category`}>Категория</label>
          <select id={`${idPrefix}-category`} name="categoryId" value={draft.categoryId} onChange={e => updateField('categoryId', e.target.value)}
            aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? `${idPrefix}-category-error` : undefined}>
            <option value="">Выберите категорию</option>
            {categories.map(category => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
          </select>
          {errors.categoryId && <span className="field-error" id={`${idPrefix}-category-error`} role="alert">{errors.categoryId}</span>}
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit">{editing ? 'Сохранить изменения' : 'Добавить задачу'}</button>
          {editing && <button className="button button-secondary" type="button" onClick={onCancel}>Отмена</button>}
        </div>
        {message && <p className={message.startsWith('Не удалось') ? 'message message-error' : 'message message-ok'} role={message.startsWith('Не удалось') ? 'alert' : 'status'}>{message}</p>}
      </form>
    </section>
  );
}
