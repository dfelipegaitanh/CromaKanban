import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { COLUMN_ACCENTS, ColumnAccentId, ThemeMode } from '../types/kanban';

interface NewColumnModalProps {
  open: boolean;
  theme: ThemeMode;
  onClose: () => void;
  onCreateColumn: (title: string, accent: ColumnAccentId) => void;
}

export const NewColumnModal: React.FC<NewColumnModalProps> = ({
  open,
  theme,
  onClose,
  onCreateColumn,
}) => {
  const isPsy = theme === 'psychedelic';
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState<ColumnAccentId>('tangerine');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreateColumn(trimmed, accent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-col-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: isPsy ? '2px solid var(--modal-border)' : `1px solid var(--modal-border)`,
          boxShadow: isPsy ? '8px 8px 0px #CCFF00' : '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="new-col-title" className="font-display text-lg font-extrabold tracking-tight">
            Nueva columna
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 sm:h-8 sm:w-8"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-column-name" className="mb-1.5 block text-xs font-semibold">
              Nombre de la columna
            </label>
            <input
              ref={inputRef}
              id="new-column-name"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Bloqueado, Experimentos, Listo"
              required
              className="h-11 w-full rounded-xl px-3.5 text-base font-medium sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold">Color de acento</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(COLUMN_ACCENTS) as ColumnAccentId[]).map((key) => {
                const item = COLUMN_ACCENTS[key];
                const color = isPsy ? item.psychedelicHex : item.standardHex;
                const selected = accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccent(key)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition-all sm:py-2"
                    style={{
                      backgroundColor: 'var(--modal-input-bg)',
                      border: selected
                        ? `2px solid ${color}`
                        : `1px solid var(--modal-input-border)`,
                    }}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold opacity-75 hover:opacity-100 sm:flex-none sm:py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 cursor-pointer rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-45 sm:flex-none sm:py-2"
              style={{
                backgroundColor: 'var(--cta-bg)',
                color: 'var(--cta-text)',
                border: isPsy ? '2px solid var(--cta-border)' : '1px solid transparent',
                boxShadow: 'var(--cta-shadow)',
              }}
            >
              Crear columna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
