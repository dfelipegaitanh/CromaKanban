import React, { useEffect } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Move,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  COLUMN_ACCENTS,
  KanbanCardItem,
  KanbanColumnItem,
} from '../types/kanban';

interface CardQuickMenuSheetProps {
  card: KanbanCardItem | null;
  columns: KanbanColumnItem[];
  cardIndexInColumn: number;
  totalInColumn: number;
  onClose: () => void;
  onMoveWithinColumn: (cardId: string, direction: -1 | 1) => void;
  onMoveToColumn: (cardId: string, targetColumnId: string) => void;
  onSelectForQuickBar: (cardId: string) => void;
  showQuickBarOption?: boolean;
  onEditCard: (card: KanbanCardItem) => void;
  onDeleteCard: (cardId: string) => void;
}

export const CardQuickMenuSheet: React.FC<CardQuickMenuSheetProps> = ({
  card,
  columns,
  cardIndexInColumn,
  totalInColumn,
  onClose,
  onMoveWithinColumn,
  onMoveToColumn,
  onSelectForQuickBar,
  showQuickBarOption = false,
  onEditCard,
  onDeleteCard,
}) => {
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onClose]);

  if (!card) return null;

  const colIndex = columns.findIndex((c) => c.id === card.columnId);
  const currentColumn = colIndex >= 0 ? columns[colIndex] : columns[0];
  const prevColumn = colIndex > 0 ? columns[colIndex - 1] : null;
  const nextColumn = colIndex >= 0 && colIndex < columns.length - 1 ? columns[colIndex + 1] : null;

  const canMoveUp = cardIndexInColumn > 0;
  const canMoveDown = cardIndexInColumn >= 0 && cardIndexInColumn < totalInColumn - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-card-menu-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-5"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: `1px solid var(--modal-border)`,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle visual indicator on mobile */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full opacity-25 sm:hidden" style={{ backgroundColor: 'var(--modal-text)' }} />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="quick-card-menu-title"
              className="font-display line-clamp-2 text-base font-extrabold tracking-tight sm:text-lg"
            >
              {card.title}
            </h2>
            <p
              className="mt-1 text-xs font-mono-tabular"
              style={{ color: 'var(--modal-text-muted)' }}
            >
              {currentColumn?.title ?? 'Columna'} · Posición {cardIndexInColumn + 1} de{' '}
              {Math.max(1, totalInColumn)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú rápido"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Vertical position controls */}
        <div className="mb-4">
          <span
            className="mb-2 block text-xs font-semibold"
            style={{ color: 'var(--modal-text-muted)' }}
          >
            Orden en esta columna
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={() => onMoveWithinColumn(card.id, -1)}
              className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold whitespace-nowrap transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <ArrowUp className="h-4 w-4 shrink-0" />
              <span>Subir</span>
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={() => onMoveWithinColumn(card.id, 1)}
              className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold whitespace-nowrap transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <ArrowDown className="h-4 w-4 shrink-0" />
              <span>Bajar</span>
            </button>
          </div>
        </div>

        {/* Cross-column controls */}
        <div className="mb-4">
          <span
            className="mb-2 block text-xs font-semibold"
            style={{ color: 'var(--modal-text-muted)' }}
          >
            Mover a otra columna
          </span>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!prevColumn}
              onClick={() => {
                if (!prevColumn) return;
                onMoveToColumn(card.id, prevColumn.id);
                onClose();
              }}
              className="flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">{prevColumn ? prevColumn.title : 'Anterior'}</span>
            </button>

            <button
              type="button"
              disabled={!nextColumn}
              onClick={() => {
                if (!nextColumn) return;
                onMoveToColumn(card.id, nextColumn.id);
                onClose();
              }}
              className="flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <span className="truncate">{nextColumn ? nextColumn.title : 'Siguiente'}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>

          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
            {columns.map((col) => {
              const isCurrent = col.id === card.columnId;
              const colColor = COLUMN_ACCENTS[col.accent].standardHex;
              return (
                <button
                  key={col.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    onMoveToColumn(card.id, col.id);
                    onClose();
                  }}
                  className="flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-left text-xs font-semibold transition-colors disabled:cursor-default"
                  style={{
                    backgroundColor: 'var(--modal-input-bg)',
                    border: isCurrent
                      ? `2px solid ${colColor}`
                      : `1px solid var(--modal-input-border)`,
                    opacity: isCurrent ? 1 : 0.9,
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colColor }}
                    />
                    <span className="truncate">{col.title}</span>
                  </div>
                  {isCurrent && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: colColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom thumb bar launcher (mobile) + Edit / Delete */}
        <div
          className="space-y-2 border-t pt-3"
          style={{ borderColor: 'var(--modal-input-border)' }}
        >
          {showQuickBarOption && (
            <button
              type="button"
              onClick={() => {
                onSelectForQuickBar(card.id);
                onClose();
              }}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold"
              style={{
                backgroundColor: 'var(--cta-bg)',
                color: 'var(--cta-text)',
                border: '1px solid transparent',
                boxShadow: 'var(--cta-shadow)',
              }}
            >
              <Move className="h-4 w-4 shrink-0" />
              <span>Fijar en barra inferior para mover rápido</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditCard(card);
              }}
              className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              <span>Editar tarjeta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteCard(card.id);
              }}
              className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-500/10"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
