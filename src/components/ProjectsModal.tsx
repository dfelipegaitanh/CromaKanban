import React, { useEffect, useRef, useState } from 'react';
import { Check, FolderKanban, Pencil, Plus, Trash2, X } from 'lucide-react';
import { BOARD_TEMPLATES } from '../data/initialBoard';
import { COLUMN_ACCENTS, ColumnAccentId, KanbanProject } from '../types/kanban';

interface ProjectsModalProps {
  open: boolean;
  startInCreateMode?: boolean;
  projects: KanbanProject[];
  activeProjectId: string;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (payload: {
    name: string;
    accent: ColumnAccentId;
    templateId: string;
  }) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  open,
  startInCreateMode = false,
  projects,
  activeProjectId,
  onClose,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}) => {
  const [isCreating, setIsCreating] = useState(startInCreateMode);
  const [newName, setNewName] = useState('');
  const [newAccent, setNewAccent] = useState<ColumnAccentId>('magenta');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-empty');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setIsCreating(startInCreateMode);
      setNewName('');
      setEditingId(null);
      setConfirmDeleteId(null);
      if (startInCreateMode) {
        window.setTimeout(() => createInputRef.current?.focus(), 30);
      }
    }
  }, [open, startInCreateMode]);

  useEffect(() => {
    if (isCreating && open) {
      window.setTimeout(() => createInputRef.current?.focus(), 20);
    }
  }, [isCreating, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProject({
      name: trimmed,
      accent: newAccent,
      templateId: selectedTemplateId,
    });
    setNewName('');
    setIsCreating(false);
    onClose();
  };

  const commitRename = (projectId: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenameProject(projectId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="projects-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--modal-text)',
          border: `1px solid var(--modal-border)`,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5 sm:gap-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{
                backgroundColor: 'var(--cta-bg)',
                color: 'var(--cta-text)',
              }}
            >
              <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 id="projects-modal-title" className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
                Mis proyectos
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--modal-text-muted)' }}>
                Crea tableros independientes para cada proyecto y alterna entre ellos al instante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold"
                style={{
                  backgroundColor: 'var(--cta-bg)',
                  color: 'var(--cta-text)',
                  border: '1px solid transparent',
                  boxShadow: 'var(--cta-shadow)',
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nuevo proyecto</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar proyectos"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Create New Project Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="mb-6 rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--modal-input-bg)',
              border: `1px solid var(--modal-input-border)`,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold">Crear nuevo proyecto</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="cursor-pointer text-xs font-semibold opacity-70 hover:opacity-100"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="new-project-name" className="mb-1 block text-xs font-semibold">
                  Nombre del proyecto
                </label>
                <input
                  ref={createInputRef}
                  id="new-project-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. App Móvil, Campaña 2027..."
                  className="h-10 w-full rounded-xl px-3 text-base font-medium sm:text-sm"
                  style={{
                    backgroundColor: 'var(--modal-bg)',
                    color: 'var(--modal-text)',
                    border: `1px solid var(--modal-input-border)`,
                  }}
                />
              </div>

              <div>
                <label htmlFor="new-project-template" className="mb-1 block text-xs font-semibold">
                  Estructura inicial
                </label>
                <select
                  id="new-project-template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="h-10 w-full rounded-xl px-3 text-base font-medium sm:text-sm"
                  style={{
                    backgroundColor: 'var(--modal-bg)',
                    color: 'var(--modal-text)',
                    border: `1px solid var(--modal-input-border)`,
                  }}
                >
                  {BOARD_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <span className="mb-1.5 block text-xs font-semibold">Color del proyecto</span>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(COLUMN_ACCENTS) as ColumnAccentId[]).map((key) => {
                  const acc = COLUMN_ACCENTS[key];
                  const color = acc.standardHex;
                  const selected = newAccent === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewAccent(key)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--modal-bg)',
                        border: selected
                          ? `2px solid ${color}`
                          : `1px solid var(--modal-input-border)`,
                      }}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="submit"
                disabled={!newName.trim()}
                className="cursor-pointer rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-45"
                style={{
                  backgroundColor: 'var(--cta-bg)',
                  color: 'var(--cta-text)',
                  border: '1px solid transparent',
                  boxShadow: 'var(--cta-shadow)',
                }}
              >
                Crear y abrir proyecto
              </button>
            </div>
          </form>
        )}

        {/* Existing Projects Grid */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            const accentHex = COLUMN_ACCENTS[proj.accent].standardHex;
            const isEditing = editingId === proj.id;

            return (
              <div
                key={proj.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl transition-transform"
                style={{
                  backgroundColor: 'var(--modal-input-bg)',
                  border: isActive
                    ? `2px solid ${accentHex}`
                    : `1px solid var(--modal-input-border)`,
                }}
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: accentHex }} />

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={editingName}
                          autoFocus
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(proj.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => commitRename(proj.id)}
                          className="w-full rounded-lg px-2 py-1 text-base font-bold sm:text-sm"
                          style={{
                            backgroundColor: 'var(--modal-bg)',
                            color: 'var(--modal-text)',
                            border: `1px solid ${accentHex}`,
                          }}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => commitRename(proj.id)}
                          aria-label="Confirmar nombre"
                          className="cursor-pointer rounded p-1"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display truncate text-base font-extrabold">
                          {proj.name}
                        </h3>
                        <p
                          className="mt-1 text-xs font-mono-tabular"
                          style={{ color: 'var(--modal-text-muted)' }}
                        >
                          {proj.columns.length} columnas · {proj.cards.length} tarjetas
                          {isActive ? ' · Activo' : ''}
                        </p>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(proj.id);
                            setEditingName(proj.name);
                            setConfirmDeleteId(null);
                          }}
                          aria-label={`Renombrar proyecto ${proj.name}`}
                          title="Renombrar"
                          className="cursor-pointer rounded-md p-1.5 opacity-65 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {proj.cards.length > 0 && (
                    <p
                      className="mt-2 text-[11px] leading-snug"
                      style={{ color: 'var(--modal-text-muted)' }}
                    >
                      Tiene tarjetas activas: vacíalo antes de poder eliminarlo.
                    </p>
                  )}

                  <div
                    className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3"
                    style={{ borderColor: 'var(--modal-border)' }}
                  >
                    {confirmDeleteId === proj.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProject(proj.id);
                            setConfirmDeleteId(null);
                          }}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-rose-600 px-2.5 text-xs font-bold text-white hover:bg-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Confirmar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-8 cursor-pointer rounded-lg px-2.5 text-xs font-semibold opacity-75 hover:opacity-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={projects.length <= 1 || proj.cards.length > 0}
                        onClick={() => setConfirmDeleteId(proj.id)}
                        aria-label={`Eliminar proyecto ${proj.name}`}
                        title={
                          projects.length <= 1
                            ? 'Debe quedar al menos un proyecto'
                            : proj.cards.length > 0
                              ? `No puedes eliminar "${proj.name}" porque tiene ${proj.cards.length} tarjeta(s)`
                              : `Eliminar proyecto "${proj.name}"`
                        }
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-rose-600 transition-opacity hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: isActive ? accentHex : 'var(--modal-bg)',
                        color: isActive ? '#FFFFFF' : 'var(--modal-text)',
                        border: isActive ? 'none' : `1px solid var(--modal-input-border)`,
                      }}
                    >
                      {isActive ? 'Abierto' : 'Abrir tablero'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
