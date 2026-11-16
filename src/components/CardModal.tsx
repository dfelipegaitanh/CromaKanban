import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import {
  ChecklistItem,
  COLUMN_ACCENTS,
  KanbanCardItem,
  KanbanColumnItem,
  PriorityLevel,
} from '../types/kanban';

interface CardModalProps {
  card: KanbanCardItem | null;
  columns: KanbanColumnItem[];
  onClose: () => void;
  onSave: (updated: KanbanCardItem) => void;
  onDelete: (cardId: string) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  columns,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState('');
  const [columnId, setColumnId] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newStepText, setNewStepText] = useState('');

  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description);
    setCategory(card.category);
    setPriority(card.priority);
    setDueDate(card.dueDate);
    setColumnId(card.columnId);
    setChecklist(card.checklist);
    setNewStepText('');
  }, [card]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onClose]);

  if (!card) return null;

  const currentCol = columns.find((c) => c.id === columnId);
  const accentHex = currentCol
    ? COLUMN_ACCENTS[currentCol.accent].standardHex
    : '#DB2777';

  const handleAddChecklistItem = () => {
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    setChecklist((prev) => [
      ...prev,
      { id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: trimmed, done: false },
    ]);
    setNewStepText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      ...card,
      title: trimmedTitle,
      description: description.trim(),
      category: category.trim(),
      priority,
      dueDate,
      columnId,
      checklist,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: `1px solid var(--modal-border)`,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
          <div>
            <h2 id="card-modal-title" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
              Editar tarjeta
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--modal-text-muted)' }}>
              Actualiza los detalles, subtareas o mueve la tarjeta de columna.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="card-title-input" className="mb-1.5 block text-xs font-semibold">
              Título
            </label>
            <input
              id="card-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl px-3.5 py-2.5 text-base font-semibold sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            />
          </div>

          <div>
            <label htmlFor="card-desc-input" className="mb-1.5 block text-xs font-semibold">
              Descripción
            </label>
            <textarea
              id="card-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agrega contexto, notas o enlaces..."
              className="w-full rounded-xl px-3.5 py-2.5 text-base leading-relaxed sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="card-col-select" className="mb-1.5 block text-xs font-semibold">
                Columna
              </label>
              <select
                id="card-col-select"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="h-10 w-full rounded-xl px-3 text-base font-medium sm:text-sm"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="card-priority-select" className="mb-1.5 block text-xs font-semibold">
                Prioridad
              </label>
              <select
                id="card-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="h-10 w-full rounded-xl px-3 text-base font-medium sm:text-sm"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              >
                <option value="high">Prioridad alta</option>
                <option value="medium">Prioridad media</option>
                <option value="low">Prioridad baja</option>
              </select>
            </div>

            <div>
              <label htmlFor="card-cat-input" className="mb-1.5 block text-xs font-semibold">
                Categoría o etiqueta
              </label>
              <input
                id="card-cat-input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej. Diseño, Frontend, Audio"
                className="h-10 w-full rounded-xl px-3 text-base sm:text-sm"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              />
            </div>

            <div>
              <label htmlFor="card-date-input" className="mb-1.5 block text-xs font-semibold">
                Fecha límite
              </label>
              <input
                id="card-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full rounded-xl px-3 text-base font-mono-tabular sm:text-sm"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              />
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--modal-input-border)' }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold">Subtareas</span>
              {checklist.length > 0 && (
                <span
                  className="text-xs font-mono-tabular"
                  style={{ color: 'var(--modal-text-muted)' }}
                >
                  {checklist.filter((i) => i.done).length}/{checklist.length} completadas
                </span>
              )}
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2"
                  style={{
                    backgroundColor: 'var(--modal-input-bg)',
                    border: `1px solid var(--modal-input-border)`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setChecklist((prev) =>
                        prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                      )
                    }
                    className="flex flex-1 cursor-pointer items-center gap-2.5 text-left text-sm"
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                      style={{
                        backgroundColor: item.done ? accentHex : 'transparent',
                        borderColor: item.done ? accentHex : 'var(--modal-text-muted)',
                        color: item.done ? '#FFFFFF' : 'transparent',
                      }}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                    <span className={item.done ? 'line-through opacity-60' : ''}>{item.text}</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar subtarea"
                    onClick={() => setChecklist((prev) => prev.filter((c) => c.id !== item.id))}
                    className="cursor-pointer rounded p-1 opacity-60 hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  placeholder="Agregar subtarea..."
                  aria-label="Agregar nueva subtarea"
                  className="h-10 min-w-0 flex-1 rounded-xl px-3 text-base sm:h-9 sm:text-sm"
                  style={{
                    backgroundColor: 'var(--modal-input-bg)',
                    color: 'var(--modal-text)',
                    border: `1px solid var(--modal-input-border)`,
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-xl px-3 text-xs font-semibold sm:h-9"
                  style={{
                    backgroundColor: 'var(--modal-input-bg)',
                    border: `1px solid var(--modal-input-border)`,
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
            style={{ borderColor: 'var(--modal-input-border)' }}
          >
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar tarjeta</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold opacity-75 hover:opacity-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-lg px-5 py-2 text-sm font-bold transition-transform active:translate-y-[1px]"
                style={{
                  backgroundColor: 'var(--cta-bg)',
                  color: 'var(--cta-text)',
                  border: '1px solid transparent',
                  boxShadow: 'var(--cta-shadow)',
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
