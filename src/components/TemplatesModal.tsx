import React, { useEffect } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { BOARD_TEMPLATES } from '../data/initialBoard';
import { BoardTemplate, ThemeMode } from '../types/kanban';

interface TemplatesModalProps {
  open: boolean;
  theme: ThemeMode;
  onClose: () => void;
  onApplyTemplate: (template: BoardTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  open,
  theme,
  onClose,
  onApplyTemplate,
}) => {
  const isPsy = theme === 'psychedelic';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="templates-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: isPsy ? '2px solid var(--modal-border)' : `1px solid var(--modal-border)`,
          boxShadow: isPsy ? '8px 8px 0px #00F5D4' : '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
          <div>
            <h2 id="templates-modal-title" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
              Plantillas de tablero
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--modal-text-muted)' }}>
              Cambia la estructura completa con columnas y tarjetas de ejemplo listas para editar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar plantillas"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {BOARD_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                onApplyTemplate(tpl);
                onClose();
              }}
              className="flex cursor-pointer flex-col justify-between rounded-xl p-4 text-left transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: isPsy
                  ? '2px solid var(--modal-border)'
                  : `1px solid var(--modal-input-border)`,
                boxShadow: isPsy ? '4px 4px 0px #FF2E93' : 'none',
              }}
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-display text-base font-bold">{tpl.name}</span>
                  <LayoutGrid className="h-4 w-4 shrink-0 opacity-60" />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--modal-text-muted)' }}>
                  {tpl.description}
                </p>
              </div>

              <div
                className="mt-4 flex items-center gap-2 border-t pt-2.5 text-xs font-mono-tabular"
                style={{
                  borderColor: 'var(--modal-input-border)',
                  color: 'var(--modal-text-muted)',
                }}
              >
                <span>{tpl.columns.length} columnas</span>
                <span aria-hidden="true">·</span>
                <span>{tpl.cards.length} tarjetas</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
