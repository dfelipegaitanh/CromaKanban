import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: '1', label: 'Cambiar a tema Oscuro' },
  { keys: '2', label: 'Cambiar a tema Claro' },
  { keys: 'I', label: 'Desglosar tareas con IA' },
  { keys: 'K', label: 'Abrir comandos IA por voz y texto' },
  { keys: 'N', label: 'Crear una nueva columna' },
  { keys: '/', label: 'Enfocar el buscador de tarjetas' },
  { keys: 'Esc', label: 'Cerrar ventana o cancelar edición' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
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
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: `1px solid var(--modal-border)`,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="shortcuts-title" className="font-display text-lg font-extrabold tracking-tight">
            Atajos de teclado
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar atajos"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--modal-input-border)' }}>
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between gap-4 py-3 text-sm"
              style={{ borderColor: 'var(--modal-input-border)' }}
            >
              <span>{s.label}</span>
              <kbd
                className="rounded-md px-2.5 py-1 text-xs font-bold font-mono-tabular"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              >
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
