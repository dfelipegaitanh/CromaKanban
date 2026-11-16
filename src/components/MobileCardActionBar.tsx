import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Columns3,
  X,
} from 'lucide-react';
import {
  COLUMN_ACCENTS,
  KanbanCardItem,
  KanbanColumnItem,
} from '../types/kanban';

interface MobileCardActionBarProps {
  card: KanbanCardItem | null;
  columns: KanbanColumnItem[];
  cardIndexInColumn: number;
  totalInColumn: number;
  onMoveWithinColumn: (cardId: string, direction: -1 | 1) => void;
  onMoveToColumn: (cardId: string, targetColumnId: string) => void;
  onClose: () => void;
}

export const MobileCardActionBar: React.FC<MobileCardActionBarProps> = ({
  card,
  columns,
  cardIndexInColumn,
  totalInColumn,
  onMoveWithinColumn,
  onMoveToColumn,
  onClose,
}) => {
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);

  useEffect(() => {
    setColumnPickerOpen(false);
  }, [card?.id]);

  if (!card) return null;

  const colIndex = columns.findIndex((c) => c.id === card.columnId);
  const currentColumn = colIndex >= 0 ? columns[colIndex] : columns[0];
  const prevColumn = colIndex > 0 ? columns[colIndex - 1] : null;
  const nextColumn = colIndex >= 0 && colIndex < columns.length - 1 ? columns[colIndex + 1] : null;

  const canMoveUp = cardIndexInColumn > 0;
  const canMoveDown = cardIndexInColumn >= 0 && cardIndexInColumn < totalInColumn - 1;

  const accentHex = currentColumn
    ? COLUMN_ACCENTS[currentColumn.accent].standardHex
    : '#0891B2';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-2.5 pb-2.5">
      {/* Direct Column Picker Popover above bar */}
      {columnPickerOpen && (
        <div
          className="mb-2 rounded-2xl p-2.5 shadow-2xl"
          style={{
            backgroundColor: 'var(--modal-bg)',
            color: 'var(--modal-text)',
            border: `1px solid var(--modal-border)`,
            boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
          }}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-bold">Elegir columna destino</span>
            <button
              type="button"
              onClick={() => setColumnPickerOpen(false)}
              aria-label="Cerrar selector de columna"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto">
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
                    setColumnPickerOpen(false);
                  }}
                  className="flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-left text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--modal-input-bg)',
                    border: isCurrent
                      ? `2px solid ${colColor}`
                      : `1px solid var(--modal-input-border)`,
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
      )}

      {/* Thumb-Zone Compact Action Bar */}
      <div
        role="region"
        aria-label="Barra rápida para mover tarjeta seleccionada"
        className="rounded-2xl px-3 py-2 shadow-2xl"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: `1px solid var(--modal-border)`,
          boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
        }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accentHex }}
            />
            <span className="truncate text-xs font-bold">{card.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="text-[11px] font-mono-tabular"
              style={{ color: 'var(--modal-text-muted)' }}
            >
              {cardIndexInColumn + 1}/{Math.max(1, totalInColumn)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Terminar movimiento rápido"
              className="flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-bold"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              <span>Listo</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => onMoveWithinColumn(card.id, -1)}
            aria-label="Subir tarjeta en columna"
            title="Subir"
            className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{
              backgroundColor: 'var(--modal-input-bg)',
              border: `1px solid var(--modal-input-border)`,
            }}
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMoveWithinColumn(card.id, 1)}
            aria-label="Bajar tarjeta en columna"
            title="Bajar"
            className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{
              backgroundColor: 'var(--modal-input-bg)',
              border: `1px solid var(--modal-input-border)`,
            }}
          >
            <ArrowDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!prevColumn}
            onClick={() => {
              if (prevColumn) onMoveToColumn(card.id, prevColumn.id);
            }}
            aria-label="Mover a columna anterior"
            title={prevColumn ? `Mover a ${prevColumn.title}` : 'Sin columna anterior'}
            className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{
              backgroundColor: 'var(--modal-input-bg)',
              border: `1px solid var(--modal-input-border)`,
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!nextColumn}
            onClick={() => {
              if (nextColumn) onMoveToColumn(card.id, nextColumn.id);
            }}
            aria-label="Mover a columna siguiente"
            title={nextColumn ? `Mover a ${nextColumn.title}` : 'Sin columna siguiente'}
            className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{
              backgroundColor: 'var(--modal-input-bg)',
              border: `1px solid var(--modal-input-border)`,
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setColumnPickerOpen((prev) => !prev)}
            aria-expanded={columnPickerOpen}
            aria-label="Elegir columna destino"
            title="Elegir columna"
            className="flex min-h-[44px] cursor-pointer items-center justify-center gap-1 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: columnPickerOpen ? 'var(--cta-bg)' : 'var(--modal-input-bg)',
              color: columnPickerOpen ? 'var(--cta-text)' : 'var(--modal-text)',
              border: `1px solid var(--modal-input-border)`,
            }}
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
