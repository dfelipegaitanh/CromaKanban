import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckSquare, GripVertical, MoreVertical, Trash2 } from 'lucide-react';
import {
  COLUMN_ACCENTS,
  ColumnAccentId,
  KanbanCardItem,
  PRIORITY_LABELS,
  ThemeMode,
} from '../types/kanban';

interface KanbanCardProps {
  card: KanbanCardItem;
  columnAccent: ColumnAccentId;
  theme: ThemeMode;
  isDraggingPlaceholder?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  onPointerStart?: (e: React.PointerEvent<HTMLElement>, card: KanbanCardItem) => void;
  onOpenCard?: (card: KanbanCardItem) => void;
  onOpenQuickMenu?: (card: KanbanCardItem) => void;
  onDeleteCard?: (cardId: string) => void;
}

const CARD_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 36,
  mass: 0.7,
};

export const KanbanCard: React.FC<KanbanCardProps> = React.memo(
  ({
    card,
    columnAccent,
    theme,
    isDraggingPlaceholder = false,
    isOverlay = false,
    isSelected = false,
    onPointerStart,
    onOpenCard,
    onOpenQuickMenu,
    onDeleteCard,
  }) => {
    const isPsy = theme === 'psychedelic';
    const accentHex = COLUMN_ACCENTS[columnAccent].psychedelicHex;

    const doneCount = card.checklist.filter((c) => c.done).length;
    const totalChecklist = card.checklist.length;

    const priorityTextColor = (() => {
      if (theme === 'psychedelic') {
        if (card.priority === 'high') return '#B80D57';
        if (card.priority === 'medium') return '#A14600';
        return '#116149';
      }
      if (theme === 'dark') {
        if (card.priority === 'high') return '#F87171';
        if (card.priority === 'medium') return '#FBBF24';
        return '#34D399';
      }
      if (card.priority === 'high') return '#DC2626';
      if (card.priority === 'medium') return '#B45309';
      return '#047857';
    })();

    const formattedDate = (() => {
      if (!card.dueDate) return '';
      const parts = card.dueDate.split('-');
      if (parts.length !== 3) return card.dueDate;
      const months = [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic',
      ];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${months[m] ?? parts[1]}`;
    })();

    if (isDraggingPlaceholder) {
      return (
        <motion.div
          layout="position"
          layoutId={`card-slot-${card.id}`}
          data-drop-card-id={card.id}
          transition={{ layout: CARD_SPRING }}
          className="rounded-xl border-2 border-dashed p-4 opacity-40"
          style={{
            backgroundColor: 'var(--control-bg)',
            borderColor: accentHex,
            color: 'transparent',
          }}
          aria-hidden="true"
        >
          <div className="mb-2 h-4 w-24" />
          <div className="h-5 w-3/4" />
          {card.description && <div className="mt-2 h-8 w-full" />}
          {(formattedDate || totalChecklist > 0) && <div className="mt-3 h-5 w-1/2" />}
        </motion.div>
      );
    }

    if (isOverlay) {
      return (
        <article
          className="cursor-grabbing rounded-xl p-4 select-none"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--card-text)',
            border: `var(--card-border-width) solid var(--card-border)`,
            boxShadow: isPsy
              ? `10px 12px 0px ${accentHex}`
              : '0 22px 44px -10px rgba(0, 0, 0, 0.42)',
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div
              className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--card-text-muted)' }}
            >
              {card.category && <span className="truncate font-semibold">{card.category}</span>}
              {card.category && <span aria-hidden="true">·</span>}
              <span className="font-semibold" style={{ color: priorityTextColor }}>
                {PRIORITY_LABELS[card.priority]}
              </span>
            </div>
            <span className="p-1 opacity-75">
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          </div>

          <h4 className="font-display text-[15px] leading-snug font-bold tracking-tight">
            {card.title}
          </h4>

          {card.description && (
            <p
              className="mt-1.5 line-clamp-2 text-xs leading-relaxed"
              style={{ color: 'var(--card-text-muted)' }}
            >
              {card.description}
            </p>
          )}

          {(formattedDate || totalChecklist > 0) && (
            <div
              className="mt-3 flex items-center gap-3 border-t pt-2.5 text-xs font-mono-tabular"
              style={{
                borderColor: isPsy ? 'rgba(22, 7, 43, 0.14)' : 'var(--card-border)',
                color: 'var(--card-text-muted)',
              }}
            >
              {formattedDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{formattedDate}</span>
                </span>
              )}
              {totalChecklist > 0 && (
                <span className="inline-flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {doneCount}/{totalChecklist}
                  </span>
                </span>
              )}
            </div>
          )}
        </article>
      );
    }

    return (
      <motion.article
        layout="position"
        layoutId={`card-slot-${card.id}`}
        data-card-interactive="true"
        data-drop-card-id={card.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }}
        transition={{
          layout: CARD_SPRING,
          opacity: { duration: 0.15 },
          y: { duration: 0.15 },
        }}
        onPointerDown={(e) => {
          if (onPointerStart) onPointerStart(e, card);
        }}
        onContextMenu={(e) => {
          if (onPointerStart) e.preventDefault();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!onOpenCard) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenCard(card);
          }
        }}
        aria-label={`Tarjeta: ${card.title}`}
        className="group relative cursor-grab rounded-xl p-3.5 select-none [-webkit-touch-callout:none] transition-transform duration-150 sm:p-4 sm:hover:-translate-y-0.5"
        style={{
          backgroundColor: 'var(--card-bg)',
          color: 'var(--card-text)',
          border: `var(--card-border-width) solid var(--card-border)`,
          boxShadow: isPsy ? `4px 4px 0px ${accentHex}` : 'var(--card-shadow)',
          outline: isSelected ? `3px solid ${accentHex}` : undefined,
          outlineOffset: isSelected ? '2px' : undefined,
        }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div
            className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--card-text-muted)' }}
          >
            {card.category && <span className="truncate font-semibold">{card.category}</span>}
            {card.category && <span aria-hidden="true">·</span>}
            <span className="font-semibold" style={{ color: priorityTextColor }}>
              {PRIORITY_LABELS[card.priority]}
            </span>
          </div>

          <div className="-mr-1.5 flex shrink-0 items-center gap-0.5 opacity-85 transition-opacity group-hover:opacity-100">
            <span
              data-drag-handle="true"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-lg opacity-70 sm:h-7 sm:w-7 sm:opacity-55 group-hover:opacity-100"
              title="Arrastrar tarjeta"
            >
              <GripVertical className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </span>
            {onOpenQuickMenu && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenQuickMenu(card);
                }}
                aria-label={`Mover u opciones de ${card.title}`}
                title="Mover o acciones rápidas"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg opacity-80 transition-colors hover:bg-black/10 sm:h-7 sm:w-7 sm:opacity-70 sm:hover:opacity-100 dark:hover:bg-white/10"
              >
                <MoreVertical className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            )}
            {onDeleteCard && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(card.id);
                }}
                aria-label={`Eliminar tarjeta ${card.title}`}
                title="Eliminar tarjeta"
                className="hidden h-7 w-7 cursor-pointer items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-black/10 sm:flex sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-white/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <h4 className="font-display text-[15px] leading-snug font-bold tracking-tight">
          {card.title}
        </h4>

        {card.description && (
          <p
            className="mt-1.5 line-clamp-2 text-xs leading-relaxed"
            style={{ color: 'var(--card-text-muted)' }}
          >
            {card.description}
          </p>
        )}

        {(formattedDate || totalChecklist > 0) && (
          <div
            className="mt-3 flex items-center gap-3 border-t pt-2.5 text-xs font-mono-tabular"
            style={{
              borderColor: isPsy ? 'rgba(22, 7, 43, 0.14)' : 'var(--card-border)',
              color: 'var(--card-text-muted)',
            }}
          >
            {formattedDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formattedDate}</span>
              </span>
            )}
            {totalChecklist > 0 && (
              <span className="inline-flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {doneCount}/{totalChecklist}
                </span>
              </span>
            )}
          </div>
        )}
      </motion.article>
    );
  }
);
