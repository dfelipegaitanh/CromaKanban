import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, RotateCcw, Send, Square, X } from 'lucide-react';
import { KanbanCardItem, KanbanColumnItem, KanbanProject, ThemeMode } from '../types/kanban';

export interface AiCommandAction {
  name: string;
  args: Record<string, unknown>;
}

interface CommandHistoryEntry {
  id: string;
  userText: string;
  viaVoice: boolean;
  reply: string;
  mutated: boolean;
}

interface AiCommandModalProps {
  open: boolean;
  theme: ThemeMode;
  projects: KanbanProject[];
  activeProjectId: string;
  columns: KanbanColumnItem[];
  cards: KanbanCardItem[];
  canUndo: boolean;
  onUndo: () => void;
  onClose: () => void;
  onExecuteActions: (actions: AiCommandAction[], reply: string) => boolean;
}

const EXAMPLE_COMMANDS = [
  'Borra las tarjetas que traten sobre música o audio',
  'Mueve las tarjetas de prioridad alta a En Progreso',
  'Ponle prioridad baja a todo lo que esté en Revisión Visual',
  'Pasa el tablero a modo oscuro y crea una columna llamada Bloqueado',
];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el audio grabado.'));
    reader.readAsDataURL(blob);
  });
}

export const AiCommandModal: React.FC<AiCommandModalProps> = ({
  open,
  theme,
  projects,
  activeProjectId,
  columns,
  cards,
  canUndo,
  onUndo,
  onClose,
  onExecuteActions,
}) => {
  const isPsy = theme === 'psychedelic';

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoReply, setInfoReply] = useState<string | null>(null);
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Latest board snapshot refs so async voice transcription uses fresh state
  const latestBoardRef = useRef({ projects, activeProjectId, columns, cards, theme });
  latestBoardRef.current = { projects, activeProjectId, columns, cards, theme };

  const stopStream = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setInfoReply(null);
      window.setTimeout(() => textareaRef.current?.focus(), 30);
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopStream();
      setIsRecording(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing && !isTranscribing) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isProcessing, isTranscribing, onClose]);

  useEffect(() => {
    return () => stopStream();
  }, []);

  if (!open) return null;

  const runCommand = async (commandText: string, viaVoice: boolean) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setInfoReply(null);

    try {
      const snap = latestBoardRef.current;
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: trimmed,
          theme: snap.theme,
          board: {
            activeProjectId: snap.activeProjectId,
            projects: snap.projects.map((p) => ({ id: p.id, name: p.name })),
            columns: snap.columns,
            cards: snap.cards.map((c) => ({
              id: c.id,
              columnId: c.columnId,
              title: c.title,
              description: c.description,
              category: c.category,
              priority: c.priority,
              dueDate: c.dueDate,
              checklistCount: c.checklist.length,
              checklistDoneCount: c.checklist.filter((s) => s.done).length,
            })),
          },
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        actions?: AiCommandAction[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo ejecutar la instrucción.');
      }

      const actions = Array.isArray(data.actions) ? data.actions : [];
      const replyText = data.reply || 'Listo.';
      const didApply = actions.length > 0 ? onExecuteActions(actions, replyText) : false;

      setHistory((prev) => [
        {
          id: `cmd-${Date.now()}`,
          userText: trimmed,
          viaVoice,
          reply: replyText,
          mutated: didApply,
        },
        ...prev.slice(0, 7),
      ]);
      setInputText('');

      if (didApply) {
        onClose();
      } else {
        setInfoReply(replyText);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error al procesar el comando con la IA.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVoice = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (isProcessing || isTranscribing) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Tu navegador no soporta grabación de micrófono. Escribe tu comando abajo.');
      return;
    }

    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedType = preferredTypes.find(
        (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
      );

      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stopStream();
        setRecordingSeconds(0);

        if (blob.size < 400) {
          setErrorMsg('El audio fue muy corto. Intenta hablar de nuevo o escribe tu instrucción.');
          return;
        }

        setIsTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const resp = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          const data = (await resp.json()) as { text?: string; error?: string };

          if (!resp.ok) {
            throw new Error(data.error || 'No se pudo transcribir tu voz.');
          }

          const transcript = (data.text ?? '').trim();
          if (!transcript) {
            setErrorMsg('No se detectó voz clara. Intenta de nuevo.');
            return;
          }

          setInputText(transcript);
          await runCommand(transcript, true);
        } catch (err) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Error al transcribir el audio.'
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      stopStream();
      setIsRecording(false);
      setErrorMsg(
        'No se pudo acceder al micrófono (revisa permisos). Puedes escribir tu instrucción normalmente.'
      );
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${String(rem).padStart(2, '0')}`;
  };

  const busy = isProcessing || isTranscribing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-cmd-title"
      onClick={() => {
        if (!busy && !isRecording) onClose();
      }}
    >
      <div
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: isPsy ? '2px solid var(--modal-border)' : `1px solid var(--modal-border)`,
          boxShadow: isPsy ? '8px 8px 0px #00F5D4' : '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{
                backgroundColor: isPsy ? '#FF2E93' : 'var(--cta-bg)',
                color: isPsy ? '#FFF9F0' : 'var(--cta-text)',
                border: isPsy ? '2px solid #16072B' : 'none',
              }}
            >
              <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 id="ai-cmd-title" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
                Comandos por voz y texto
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--modal-text-muted)' }}>
                Pide en palabras naturales borrar, mover, editar o crear tarjetas y columnas.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || isRecording}
            onClick={onClose}
            aria-label="Cerrar comandos IA"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 disabled:opacity-40 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runCommand(inputText, false);
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor="ai-command-input" className="mb-1.5 block text-xs font-semibold">
              Tu instrucción para el tablero
            </label>
            <textarea
              ref={textareaRef}
              id="ai-command-input"
              rows={3}
              value={inputText}
              disabled={busy || isRecording}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void runCommand(inputText, false);
                }
              }}
              placeholder='Ej. "Quiero que borres las tarjetas que hablen de música" o "Mueve las tarjetas de prioridad alta a En Progreso"'
              className="w-full rounded-xl px-3.5 py-3 text-base leading-relaxed disabled:opacity-60 sm:text-sm"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                color: 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              {errorMsg}
            </div>
          )}

          {infoReply && !errorMsg && (
            <div
              role="status"
              className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed font-medium"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              {infoReply}
            </div>
          )}

          {/* Voice + Submit controls */}
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleToggleVoice()}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all disabled:opacity-45 sm:h-10 sm:w-auto"
              style={{
                backgroundColor: isRecording
                  ? '#DC2626'
                  : isPsy
                    ? '#CCFF00'
                    : 'var(--modal-input-bg)',
                color: isRecording
                  ? '#FFFFFF'
                  : isPsy
                    ? '#16072B'
                    : 'var(--modal-text)',
                border: isPsy ? '2px solid #16072B' : `1px solid var(--modal-input-border)`,
              }}
            >
              {isRecording ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span className="font-mono-tabular">
                    Detener voz ({formatTimer(recordingSeconds)})
                  </span>
                </>
              ) : isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Transcribiendo...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Hablar por micrófono</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || busy || isRecording}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-transform active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:w-auto"
              style={{
                backgroundColor: 'var(--cta-bg)',
                color: 'var(--cta-text)',
                border: isPsy ? '2px solid var(--cta-border)' : '1px solid transparent',
                boxShadow: 'var(--cta-shadow)',
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ejecutando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Aplicar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Action History or Example Prompts */}
        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: 'var(--modal-input-border)' }}
        >
          {history.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--modal-text-muted)' }}
                >
                  Historial reciente
                </span>
                {canUndo && (
                  <button
                    type="button"
                    onClick={onUndo}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Deshacer último cambio</span>
                  </button>
                )}
              </div>

              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl p-3 text-xs"
                  style={{
                    backgroundColor: 'var(--modal-input-bg)',
                    border: `1px solid var(--modal-input-border)`,
                  }}
                >
                  <p className="font-semibold">
                    {entry.viaVoice ? 'Voz: ' : 'Tú: '}
                    <span className="font-normal opacity-85">"{entry.userText}"</span>
                  </p>
                  <p className="mt-1.5 leading-relaxed" style={{ color: 'var(--modal-text-muted)' }}>
                    {entry.reply}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <span
                className="mb-2 block text-[11px] font-semibold"
                style={{ color: 'var(--modal-text-muted)' }}
              >
                Ejemplos de lo que puedes pedir:
              </span>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {EXAMPLE_COMMANDS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={busy || isRecording}
                    onClick={() => setInputText(example)}
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
        </div>
      </div>
    </div>
  );
};
