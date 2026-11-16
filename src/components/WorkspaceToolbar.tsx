import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Mic,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  ActiveView,
  COLUMN_ACCENTS,
  KanbanProject,
  LayoutMode,
  PriorityLevel,
  ThemeMode,
} from '../types/kanban';

interface WorkspaceToolbarProps {
  theme: ThemeMode;
  layoutMode: LayoutMode;
  onChangeTheme: (theme: ThemeMode) => void;
  projects: KanbanProject[];
  activeProject: KanbanProject;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  onOpenProjectsManager: () => void;
  onDeleteProject: (projectId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: PriorityLevel | 'all';
  onPriorityFilterChange: (p: PriorityLevel | 'all') => void;
  totalCards: number;
  visibleCards: number;
  totalColumns: number;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenTemplates: () => void;
  onOpenAiBreakdown: () => void;
  onOpenAiCommand: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  theme,
  layoutMode,
  onChangeTheme,
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProject,
  onOpenProjectsManager,
  onDeleteProject,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  totalCards,
  visibleCards,
  totalColumns,
  onOpenAiBreakdown,
  onOpenAiCommand,
}) => {
  const isMobileLayout = layoutMode === 'mobile';
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [projectMenuOpen]);

  const activeAccentColor = COLUMN_ACCENTS[activeProject.accent].standardHex;

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Oscuro', icon: <Moon className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'light', label: 'Claro', icon: <Sun className="h-3.5 w-3.5 shrink-0" /> },
  ];

  const filterOptions: { id: PriorityLevel | 'all'; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'high', label: 'Alta' },
    { id: 'medium', label: 'Media' },
    { id: 'low', label: 'Baja' },
  ];

  const hasFilterActive = priorityFilter !== 'all';

  return (
    <section
      aria-label="Controles del tablero"
      className="relative z-20 shrink-0 border-b backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: 'var(--toolbar-bg)',
        borderColor: 'var(--header-border)',
      }}
    >
      <div
        className={`mx-auto flex max-w-[1600px] ${
          isMobileLayout
            ? 'flex-col gap-2 px-3.5 py-2'
            : 'flex-row flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8'
        }`}
      >
        {/* Row 1 on Mobile / Left Cluster on Desktop: Project Switcher + Search */}
        <div
          className={`flex items-center ${
            isMobileLayout
              ? 'w-full gap-2'
              : 'min-w-0 flex-1 flex-wrap gap-2.5'
          }`}
        >
          {/* Active Project Dropdown */}
          <div
            className={`relative shrink-0 ${
              isMobileLayout ? 'max-w-[46%]' : 'max-w-[210px]'
            }`}
            ref={projectMenuRef}
          >
            <button
              type="button"
              onClick={() => setProjectMenuOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={projectMenuOpen}
              className={`inline-flex w-full cursor-pointer items-center rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                isMobileLayout ? 'h-9 gap-1.5 px-2.5' : 'h-10 gap-2 px-3'
              }`}
              style={{
                backgroundColor: 'var(--control-bg)',
                border: `1px solid var(--control-border)`,
                color: 'var(--control-text)',
              }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: activeAccentColor }}
              />
              <span className="truncate">{activeProject.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-75" />
            </button>

            {projectMenuOpen && (
              <div
                className="absolute left-0 z-50 mt-1.5 w-[min(17.5rem,calc(100vw-1.75rem))] rounded-xl p-2 shadow-2xl"
                style={{
                  backgroundColor: 'var(--modal-bg)',
                  color: 'var(--modal-text)',
                  border: `1px solid var(--modal-border)`,
                  boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className="mb-1 flex items-center justify-between px-2 py-1 text-[11px] font-semibold"
                  style={{ color: 'var(--modal-text-muted)' }}
                >
                  <span>Proyectos ({projects.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      onOpenProjectsManager();
                    }}
                    className="cursor-pointer underline hover:opacity-100"
                  >
                    Administrar
                  </button>
                </div>

                <div className="max-h-60 space-y-1 overflow-y-auto">
                  {projects.map((proj) => {
                    const isCurrent = proj.id === activeProject.id;
                    const hasCards = proj.cards.length > 0;
                    const canDelete = projects.length > 1 && !hasCards;
                    const pColor = COLUMN_ACCENTS[proj.accent].standardHex;
                    return (
                      <div
                        key={proj.id}
                        className="flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProject(proj.id);
                            setProjectMenuOpen(false);
                          }}
                          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: pColor }}
                            />
                            <span className={`truncate ${isCurrent ? 'font-bold' : 'font-medium'}`}>
                              {proj.name}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span
                              className="text-[11px] font-mono-tabular"
                              style={{ color: 'var(--modal-text-muted)' }}
                            >
                              {proj.cards.length}
                            </span>
                            {isCurrent && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </button>
                        {projects.length > 1 && (
                          <button
                            type="button"
                            disabled={!canDelete}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(proj.id);
                              setProjectMenuOpen(false);
                            }}
                            aria-label={`Eliminar proyecto ${proj.name}`}
                            title={
                              hasCards
                                ? `No puedes borrar "${proj.name}" porque tiene ${proj.cards.length} tarjeta(s)`
                                : `Eliminar proyecto "${proj.name}"`
                            }
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-rose-600 transition-colors hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-2 border-t pt-2"
                  style={{ borderColor: 'var(--modal-input-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      onOpenNewProject();
                    }}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--cta-bg)',
                      color: 'var(--cta-text)',
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Crear nuevo proyecto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Input (16px on mobile to prevent iOS zoom) */}
          <div
            className={`relative min-w-0 flex-1 ${
              isMobileLayout ? '' : 'min-w-[160px] max-w-[240px]'
            }`}
          >
            <Search
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-65 ${
                isMobileLayout ? 'left-2.5 h-3.5 w-3.5' : 'left-3 h-4 w-4'
              }`}
              style={{ color: 'var(--text-on-canvas)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar tarjetas..."
              aria-label="Buscar tarjetas o etiquetas"
              className={`w-full rounded-lg transition-colors placeholder:text-xs placeholder:opacity-60 ${
                isMobileLayout
                  ? 'h-9 pr-7 pl-8 text-base'
                  : 'h-10 pr-8 pl-9 text-sm'
              }`}
              style={{
                backgroundColor: 'var(--control-bg)',
                border: `1px solid var(--control-border)`,
                color: 'var(--control-text)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda"
                className={`absolute top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 opacity-70 hover:opacity-100 ${
                  isMobileLayout ? 'right-1.5' : 'right-2'
                }`}
                style={{ color: 'var(--control-text)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Desktop AI Triggers inline */}
          {!isMobileLayout && (
            <>
              <button
                type="button"
                onClick={onOpenAiBreakdown}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-bold whitespace-nowrap shrink-0 transition-transform active:translate-y-[1px]"
                style={{
                  backgroundColor: 'var(--control-bg)',
                  color: 'var(--control-text)',
                  border: `1px solid var(--control-border)`,
                }}
              >
                <Wand2 className="h-3.5 w-3.5 shrink-0" />
                <span>Desglosar con IA</span>
              </button>

              <button
                type="button"
                onClick={onOpenAiCommand}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-bold whitespace-nowrap shrink-0 transition-transform active:translate-y-[1px]"
                style={{
                  backgroundColor: 'var(--control-bg)',
                  color: 'var(--control-text)',
                  border: `1px solid var(--control-border)`,
                }}
              >
                <Mic className="h-3.5 w-3.5 shrink-0" />
                <span>Voz / Comandos</span>
              </button>

              <div
                className="hidden xl:flex items-center gap-2 text-xs font-mono-tabular"
                style={{ color: 'var(--text-on-canvas-muted)' }}
              >
                <span>
                  {visibleCards === totalCards
                    ? `${totalCards} tarjetas`
                    : `${visibleCards} de ${totalCards} tarjetas`}
                </span>
                <span aria-hidden="true">·</span>
                <span>{totalColumns} columnas</span>
              </div>
            </>
          )}
        </div>

        {/* Row 2 on Mobile: Compact single-line AI + Filters/Theme trigger */}
        {isMobileLayout && (
          <div className="flex w-full items-center gap-2">
            <button
              type="button"
              onClick={onOpenAiBreakdown}
              className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold whitespace-nowrap transition-transform active:translate-y-[1px]"
              style={{
                backgroundColor: 'var(--control-bg)',
                color: 'var(--control-text)',
                border: `1px solid var(--control-border)`,
              }}
            >
              <Wand2 className="h-3.5 w-3.5 shrink-0" />
              <span>Desglosar</span>
            </button>

            <button
              type="button"
              onClick={onOpenAiCommand}
              className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold whitespace-nowrap transition-transform active:translate-y-[1px]"
              style={{
                backgroundColor: 'var(--control-bg)',
                color: 'var(--control-text)',
                border: `1px solid var(--control-border)`,
              }}
            >
              <Mic className="h-3.5 w-3.5 shrink-0" />
              <span>Voz / IA</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileControlsOpen((prev) => !prev)}
              aria-expanded={mobileControlsOpen}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap"
              style={{
                backgroundColor:
                  mobileControlsOpen || hasFilterActive ? 'var(--cta-bg)' : 'var(--control-bg)',
                color:
                  mobileControlsOpen || hasFilterActive ? 'var(--cta-text)' : 'var(--control-text)',
                border: `1px solid var(--control-border)`,
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              <span>Filtros</span>
            </button>
          </div>
        )}

        {/* Mobile Collapsible Filters + Theme Drawer */}
        {isMobileLayout && mobileControlsOpen && (
          <div
            className="flex flex-col gap-2.5 border-t pt-2.5"
            style={{ borderColor: 'var(--header-border)' }}
          >
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold opacity-80">
                <span>Prioridad</span>
                <span className="font-mono-tabular">
                  {visibleCards}/{totalCards} tarjetas · {totalColumns} col
                </span>
              </div>
              <div
                role="group"
                aria-label="Filtrar por prioridad"
                className="grid grid-cols-4 gap-1 rounded-lg p-1"
                style={{
                  backgroundColor: 'var(--control-bg)',
                  border: `1px solid var(--control-border)`,
                }}
              >
                {filterOptions.map((opt) => {
                  const isSelected = priorityFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onPriorityFilterChange(opt.id)}
                      className="cursor-pointer rounded-md py-1.5 text-center text-xs font-semibold whitespace-nowrap transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? 'var(--cta-bg)' : 'transparent',
                        color: isSelected ? 'var(--cta-text)' : 'var(--control-text)',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1 block text-[11px] font-semibold opacity-80">Tema visual</span>
              <div
                role="group"
                aria-label="Selector de tema visual"
                className="grid grid-cols-2 gap-1 rounded-lg p-1"
                style={{
                  backgroundColor: 'var(--control-bg)',
                  border: `1px solid var(--control-border)`,
                }}
              >
                {themeOptions.map((opt) => {
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeTheme(opt.id)}
                      aria-pressed={isSelected}
                      className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? 'var(--cta-bg)' : 'transparent',
                        color: isSelected ? 'var(--cta-text)' : 'var(--control-text)',
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Cluster (Desktop): Priority filter + Theme mode segmented control */}
        {!isMobileLayout && (
          <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Filtrar por prioridad"
            className="flex items-center gap-1 rounded-lg p-1"
            style={{
              backgroundColor: 'var(--control-bg)',
              border: `1px solid var(--control-border)`,
            }}
          >
            {filterOptions.map((opt) => {
              const isSelected = priorityFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPriorityFilterChange(opt.id)}
                  className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150"
                  style={{
                    backgroundColor: isSelected ? 'var(--cta-bg)' : 'transparent',
                    color: isSelected ? 'var(--cta-text)' : 'var(--control-text)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Selector de tema visual"
            className="flex items-center gap-1 rounded-lg p-1"
            style={{
              backgroundColor: 'var(--control-bg)',
              border: `1px solid var(--control-border)`,
            }}
          >
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeTheme(opt.id)}
                  aria-pressed={isSelected}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150"
                  style={{
                    backgroundColor: isSelected ? 'var(--cta-bg)' : 'transparent',
                    color: isSelected ? 'var(--cta-text)' : 'var(--control-text)',
                  }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </section>
  );
};
