import React from 'react';
import { ArrowLeft, Calendar, CheckSquare } from 'lucide-react';
import {
  COLUMN_ACCENTS,
  KanbanCardItem,
  KanbanColumnItem,
  PRIORITY_LABELS,
  PriorityLevel,
} from '../types/kanban';

interface SummaryViewProps {
  columns: KanbanColumnItem[];
  cards: KanbanCardItem[];
  onBackToBoard: () => void;
  onOpenCard: (card: KanbanCardItem) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  columns,
  cards,
  onBackToBoard,
  onOpenCard,
}) => {
  const totalCards = cards.length;
  const allSteps = cards.flatMap((c) => c.checklist);
  const doneSteps = allSteps.filter((s) => s.done).length;
  const highCount = cards.filter((c) => c.priority === 'high').length;
  const withDateCount = cards.filter((c) => Boolean(c.dueDate)).length;

  const priorityGroups: { id: PriorityLevel; label: string; count: number; color: string }[] = [
    {
      id: 'high',
      label: PRIORITY_LABELS.high,
      count: highCount,
      color: '#DC2626',
    },
    {
      id: 'medium',
      label: PRIORITY_LABELS.medium,
      count: cards.filter((c) => c.priority === 'medium').length,
      color: '#D97706',
    },
    {
      id: 'low',
      label: PRIORITY_LABELS.low,
      count: cards.filter((c) => c.priority === 'low').length,
      color: '#16A34A',
    },
  ];

  const upcomingCards = [...cards]
    .filter((c) => Boolean(c.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <main className="relative z-10 mx-auto w-full max-w-[1280px] px-3.5 py-5 sm:px-8 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Resumen del tablero
          </h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-on-canvas-muted)' }}>
            Distribución actual de tarjetas por columna, prioridad y subtareas completadas.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToBoard}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-xs font-semibold sm:text-sm"
          style={{
            backgroundColor: 'var(--control-bg)',
            color: 'var(--control-text)',
            border: `1px solid var(--control-border)`,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al tablero</span>
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
        {[
          { label: 'Total de tarjetas', value: String(totalCards) },
          { label: 'Columnas activas', value: String(columns.length) },
          { label: 'Prioridad alta', value: String(highCount) },
          {
            label: 'Subtareas listas',
            value: allSteps.length > 0 ? `${doneSteps}/${allSteps.length}` : '0',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-4 sm:p-5"
            style={{
              backgroundColor: 'var(--card-bg)',
              color: 'var(--card-text)',
              border: `var(--card-border-width) solid var(--card-border)`,
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--card-text-muted)' }}>
              {kpi.label}
            </p>
            <p className="font-display mt-1.5 text-2xl font-extrabold font-mono-tabular sm:mt-2 sm:text-3xl">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Cards per column breakdown */}
        <section
          className="rounded-2xl p-4 sm:p-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--card-text)',
            border: `var(--card-border-width) solid var(--card-border)`,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h2 className="font-display mb-4 text-lg font-bold">Tarjetas por columna</h2>
          <div className="space-y-4">
            {columns.map((col) => {
              const count = cards.filter((c) => c.columnId === col.id).length;
              const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
              const barColor = COLUMN_ACCENTS[col.accent].standardHex;
              return (
                <div key={col.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">{col.title}</span>
                    <span
                      className="text-xs font-mono-tabular"
                      style={{ color: 'var(--card-text-muted)' }}
                    >
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--modal-input-border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Priority distribution */}
        <section
          className="rounded-2xl p-4 sm:p-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--card-text)',
            border: `var(--card-border-width) solid var(--card-border)`,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h2 className="font-display mb-4 text-lg font-bold">Distribución por prioridad</h2>
          <div className="space-y-4">
            {priorityGroups.map((grp) => {
              const pct = totalCards > 0 ? Math.round((grp.count / totalCards) * 100) : 0;
              return (
                <div key={grp.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">{grp.label}</span>
                    <span
                      className="text-xs font-mono-tabular"
                      style={{ color: 'var(--card-text-muted)' }}
                    >
                      {grp.count} ({pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--modal-input-border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: grp.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Upcoming deadlines table */}
      <section
        className="mt-4 rounded-2xl p-4 sm:mt-6 sm:p-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          color: 'var(--card-text)',
          border: `var(--card-border-width) solid var(--card-border)`,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Próximas fechas límite</h2>
          <span
            className="text-xs font-mono-tabular"
            style={{ color: 'var(--card-text-muted)' }}
          >
            {withDateCount} programadas
          </span>
        </div>

        {upcomingCards.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--card-text-muted)' }}>
            No hay tarjetas con fecha límite asignada todavía.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--modal-input-border)' }}>
            {upcomingCards.map((card) => {
              const col = columns.find((c) => c.id === card.columnId);
              const done = card.checklist.filter((s) => s.done).length;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onOpenCard(card)}
                  className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 py-3 text-left transition-opacity hover:opacity-80"
                  style={{ borderColor: 'var(--modal-input-border)' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{card.title}</p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--card-text-muted)' }}>
                      {col?.title ?? 'Sin columna'} · {PRIORITY_LABELS[card.priority]}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-4 text-xs font-mono-tabular"
                    style={{ color: 'var(--card-text-muted)' }}
                  >
                    {card.checklist.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {done}/{card.checklist.length}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {card.dueDate}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
