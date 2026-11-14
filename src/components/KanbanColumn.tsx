import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MoreHorizontal,
  Palette,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  COLUMN_ACCENTS,
  ColumnAccentId,
  KanbanCardItem,
  KanbanColumnItem,
  LayoutMode,
  PriorityLevel,
  ThemeMode,
} from '../types/kanban';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnItem;
  cards: KanbanCardItem[];
  theme: ThemeMode;
  layoutMode?: LayoutMode;
  columnIndex: number;
  totalColumns: number;
  draggedCardId: string | null;
  selectedCardId?: string | null;
  isCardDragging?: boolean;
  isColumnDropTarget: boolean;
  onCardPointerStart: (e: React.PointerEvent<HTMLElement>, card: KanbanCardItem) => void;
  onDragOverColumn: (e: React.DragEvent<HTMLElement>, columnId: string) => void;
  onDropOnColumn: (e: React.DragEvent<HTMLElement>, columnId: string) => void;
  onColumnDragStart: (e: React.DragEvent<HTMLElement>, columnId: string) => void;
  onAddCard: (
    columnId: string,
    payload: {
      title: string;
      category: string;
      priority: PriorityLevel;
    }
  ) => void;
  onOpenCard: (card: KanbanCardItem) => void;
  onOpenCardQuickMenu: (card: KanbanCardItem) => void;
  onDeleteCard: (cardId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onChangeColumnAccent: (columnId: string, accent: ColumnAccentId) => void;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  cards,
  theme,
  layoutMode = 'desktop',
  columnIndex,
  totalColumns,
  draggedCardId,
  selectedCardId = null,
  isCardDragging = false,
  isColumnDropTarget,
  onCardPointerStart,
  onDragOverColumn,
  onDropOnColumn,
  onColumnDragStart,
  onAddCard,
  onOpenCard,
  onOpenCardQuickMenu,
  onDeleteCard,
  onRenameColumn,
  onChangeColumnAccent,
  onMoveColumn,
  onDeleteColumn,
}) => {
  const isPsy = theme === 'psychedelic';
  const accentToken = COLUMN_ACCENTS[column.accent];
  const accentColor = isPsy ? accentToken.psychedelicHex : accentToken.standardHex;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<PriorityLevel>('medium');

  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newCardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isAddingCard) {
      newCardInputRef.current?.focus();
    }
  }, [isAddingCard]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed);
    } else {
      setTitleDraft(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCardTitle.trim();
    if (!trimmed) return;
    onAddCard(column.id, {
      title: trimmed,
      category: newCardCategory.trim(),
      priority: newCardPriority,
    });
    setNewCardTitle('');
    setNewCardCategory('');
    setNewCardPriority('medium');
    setIsAddingCard(false);
  };

  return (
    <section
      data-drop-column-id={column.id}
      data-column-el-id={column.id}
      aria-label={`Columna ${column.title}`}
      onDragOver={(e) => onDragOverColumn(e, column.id)}
      onDrop={(e) => onDropOnColumn(e, column.id)}
      className={`relative flex max-h-full shrink-0 flex-col rounded-2xl transition-colors duration-150 ${
        layoutMode === 'mobile' ? 'w-[84vw] max-w-[336px] snap-center' : 'w-[328px]'
      }`}
      style={{
        backgroundColor: 'var(--column-bg)',
        border: isColumnDropTarget
          ? `2px solid ${accentColor}`
          : isPsy
            ? `2px solid ${accentColor}`
            : `1px solid var(--column-border)`,
        boxShadow: isPsy
          ? `6px 6px 0px rgba(22, 7, 43, 0.85)`
          : 'var(--column-shadow)',
      }}
    >
      {/* Top horizontal color accent bar */}
      <div
        className="h-1.5 w-full shrink-0 rounded-t-[14px]"
        style={{ backgroundColor: accentColor }}
      />

      {/* Column Header */}
      <div
        draggable={!isEditingTitle}
        data-column-header-drag="true"
        onDragStart={(e) => onColumnDragStart(e, column.id)}
        className="flex cursor-grab items-center justify-between gap-2 px-3.5 pt-3 pb-2 active:cursor-grabbing sm:px-4 sm:pt-3.5 sm:pb-2.5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isEditingTitle ? (
            <div className="flex flex-1 items-center gap-1.5">
              <input
                ref={titleInputRef}
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle();
                  if (e.key === 'Escape') {
                    setTitleDraft(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full rounded-md px-2 py-1 text-sm font-bold"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid ${accentColor}`,
                }}
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitTitle}
                aria-label="Confirmar título"
                className="cursor-pointer rounded p-1"
                style={{ color: accentColor }}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              title="Haz clic para renombrar esta columna"
              className="font-display cursor-text truncate text-left text-base font-extrabold tracking-tight"
              style={{
                color: isPsy ? accentColor : 'var(--text-on-canvas)',
              }}
            >
              {column.title}
            </button>
          )}

          <span
            className="shrink-0 text-xs font-mono-tabular opacity-75"
            style={{ color: 'var(--text-on-canvas-muted)' }}
          >
            {cards.length}
          </span>
        </div>

        {/* Column Actions Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={`Opciones de columna ${column.title}`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-on-canvas-muted)' }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 z-40 mt-1 w-56 max-w-[calc(100vw-2rem)] rounded-xl p-2 shadow-xl"
              style={{
                backgroundColor: 'var(--modal-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-border)`,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditingTitle(true);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span>Renombrar columna</span>
              </button>

              <div className="my-1 flex items-center gap-1">
                <button
                  type="button"
                  disabled={columnIndex === 0}
                  onClick={() => {
                    onMoveColumn(column.id, -1);
                    setMenuOpen(false);
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Izquierda</span>
                </button>
                <button
                  type="button"
                  disabled={columnIndex === totalColumns - 1}
                  onClick={() => {
                    onMoveColumn(column.id, 1);
                    setMenuOpen(false);
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span>Derecha</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-1 border-t pt-2" style={{ borderColor: 'var(--modal-input-border)' }}>
                <div className="mb-1.5 flex items-center gap-1.5 px-2 text-[11px] font-semibold opacity-75">
                  <Palette className="h-3 w-3" />
                  <span>Color de columna</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 px-2 pb-2">
                  {(Object.keys(COLUMN_ACCENTS) as ColumnAccentId[]).map((accKey) => {
                    const acc = COLUMN_ACCENTS[accKey];
                    const selected = accKey === column.accent;
                    return (
                      <button
                        key={accKey}
                        type="button"
                        aria-label={`Color ${acc.label}`}
                        title={acc.label}
                        onClick={() => {
                          onChangeColumnAccent(column.id, accKey);
                          setMenuOpen(false);
                        }}
                        className="h-6 w-6 cursor-pointer rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: isPsy ? acc.psychedelicHex : acc.standardHex,
                          borderColor: selected ? 'var(--modal-text)' : 'transparent',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteColumn(column.id);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar columna</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div
        className={`kanban-scroll flex min-h-0 flex-1 flex-col gap-2.5 px-3 pb-2.5 sm:gap-3 sm:px-3.5 sm:pb-3 ${
          isCardDragging ? 'touch-none overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        {cards.length === 0 && !isAddingCard && (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center text-xs"
            style={{
              borderColor: isPsy ? 'rgba(255, 250, 240, 0.3)' : 'var(--column-border)',
              color: 'var(--text-on-canvas-muted)',
            }}
          >
            <p className="font-medium">Sin tarjetas aún</p>
            <p className="mt-1 opacity-75">Arrastra una aquí o crea una nueva abajo.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnAccent={column.accent}
              theme={theme}
              isDraggingPlaceholder={draggedCardId === card.id}
              isSelected={selectedCardId === card.id}
              onPointerStart={onCardPointerStart}
              onOpenCard={onOpenCard}
              onOpenQuickMenu={onOpenCardQuickMenu}
              onDeleteCard={onDeleteCard}
            />
          ))}
        </AnimatePresence>

        {/* Quick Inline Add Card Form */}
        {isAddingCard && (
          <motion.form
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onSubmit={handleCreateCard}
            className="rounded-xl p-3.5"
            style={{
              backgroundColor: 'var(--card-bg)',
              color: 'var(--card-text)',
              border: `var(--card-border-width) solid var(--card-border)`,
              boxShadow: isPsy ? `4px 4px 0px ${accentColor}` : 'var(--card-shadow)',
            }}
          >
            <input
              ref={newCardInputRef}
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsAddingCard(false);
                }
              }}
              placeholder="Título de la tarjeta..."
              aria-label="Título de la nueva tarjeta"
              className="w-full rounded-lg px-2.5 py-2 text-base font-semibold sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            />

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newCardCategory}
                onChange={(e) => setNewCardCategory(e.target.value)}
                placeholder="Etiqueta (ej. Diseño)"
                aria-label="Etiqueta de categoría"
                className="rounded-lg px-2.5 py-1.5 text-base sm:text-xs"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              />
              <select
                value={newCardPriority}
                onChange={(e) => setNewCardPriority(e.target.value as PriorityLevel)}
                aria-label="Prioridad"
                className="rounded-lg px-2 py-1.5 text-base font-medium sm:text-xs"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-input-border)`,
                }}
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold opacity-75 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                disabled={!newCardTitle.trim()}
                className="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  backgroundColor: accentColor,
                  color: isPsy ? accentToken.psychedelicTextOnHex : '#FFFFFF',
                }}
              >
                Agregar
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {/* Column Footer: Add Card Trigger */}
      {!isAddingCard && (
        <div className="shrink-0 px-3 pt-1 pb-3 sm:px-3.5 sm:pb-3.5">
          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--control-bg)',
              color: 'var(--text-on-canvas)',
              border: `1px solid var(--control-border)`,
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Agregar tarjeta</span>
          </button>
        </div>
      )}
    </section>
  );
};
