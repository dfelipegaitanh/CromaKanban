import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Wand2, X } from 'lucide-react';
import { KanbanColumnItem, PriorityLevel } from '../types/kanban';

export interface AiGeneratedTaskPayload {
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  checklist: string[];
}

interface AiBreakdownModalProps {
  open: boolean;
  columns: KanbanColumnItem[];
  defaultColumnId: string;
  onClose: () => void;
  onTasksGenerated: (columnId: string, tasks: AiGeneratedTaskPayload[]) => void;
}

const EXAMPLE_PROMPTS = [
  'Lanzar una tienda online de ropa vintage con fotos, pagos y envíos',
  'Organizar un evento de música electrónica para 150 personas este mes',
  'Mudarme de apartamento: empacar, contratar flete y cambiar servicios',
];

export const AiBreakdownModal: React.FC<AiBreakdownModalProps> = ({
  open,
  columns,
  defaultColumnId,
  onClose,
  onTasksGenerated,
}) => {
  const [goalText, setGoalText] = useState('');
  const [targetColumnId, setTargetColumnId] = useState(defaultColumnId);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTargetColumnId(defaultColumnId);
      setErrorMsg(null);
      window.setTimeout(() => textareaRef.current?.focus(), 30);
    }
  }, [open, defaultColumnId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const targetColumn = columns.find((c) => c.id === targetColumnId);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = goalText.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: trimmed,
          targetColumnTitle: targetColumn?.title ?? 'Pendientes',
        }),
      });

      const data = (await response.json()) as {
        tasks?: AiGeneratedTaskPayload[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron generar las tareas.');
      }

      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('La IA no encontró tareas accionables en ese texto. Intenta detallarlo un poco más.');
      }

      onTasksGenerated(targetColumnId, data.tasks);
      setGoalText('');
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Ocurrió un error al conectar con la IA.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      onClick={() => {
        if (!loading) onClose();
      }}
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
        <div className="mb-4 flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{
                backgroundColor: 'var(--cta-bg)',
                color: 'var(--cta-text)',
              }}
            >
              <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 id="ai-modal-title" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
                Desglosar tareas con IA
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--modal-text-muted)' }}>
                Escribe cualquier idea, proyecto o lista desordenada y la IA creará tarjetas listas en pendientes.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Cerrar asistente de tareas"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 disabled:opacity-40 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ai-goal-textarea" className="mb-1.5 block text-xs font-semibold">
              ¿Qué quieres hacer o lograr?
            </label>
            <textarea
              ref={textareaRef}
              id="ai-goal-textarea"
              rows={4}
              value={goalText}
              disabled={loading}
              onChange={(e) => setGoalText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Ej. Quiero armar una fiesta temática de los 70, necesito conseguir proyector, hacer playlist, comprar bebidas, diseñar la invitación y confirmar invitados..."
              className="w-full rounded-xl px-3.5 py-3 text-base leading-relaxed disabled:opacity-60 sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            />
          </div>

          {/* Quick inspiration suggestions */}
          {!goalText.trim() && (
            <div>
              <span
                className="mb-1.5 block text-[11px] font-semibold"
                style={{ color: 'var(--modal-text-muted)' }}
              >
                Ideas rápidas para probar:
              </span>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={loading}
                    onClick={() => setGoalText(example)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      backgroundColor: 'var(--modal-input-bg)',
                      border: `1px solid var(--modal-input-border)`,
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Column Selector */}
          <div>
            <label htmlFor="ai-target-col" className="mb-1.5 block text-xs font-semibold">
              Enviar tareas generadas a
            </label>
            <select
              id="ai-target-col"
              value={targetColumnId}
              disabled={loading}
              onChange={(e) => setTargetColumnId(e.target.value)}
              className="h-10 w-full rounded-xl px-3 text-base font-medium sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
              {columns.length === 0 && <option value="new-pending">Pendientes (se creará)</option>}
            </select>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              {errorMsg}
            </div>
          )}

          <div
            className="flex flex-col-reverse gap-2.5 border-t pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            style={{ borderColor: 'var(--modal-input-border)' }}
          >
            <span className="hidden text-[11px] sm:inline" style={{ color: 'var(--modal-text-muted)' }}>
              Atajo: Ctrl + Enter para enviar
            </span>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold opacity-75 hover:opacity-100 disabled:opacity-40 sm:flex-none sm:py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!goalText.trim() || loading}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-transform active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:py-2"
                style={{
                  backgroundColor: 'var(--cta-bg)',
                  color: 'var(--cta-text)',
                  border: '1px solid transparent',
                  boxShadow: 'var(--cta-shadow)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Desglosando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Desglosar y enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
