import React, { useEffect, useRef, useState } from 'react';
import { Menu, Monitor, Plus, Smartphone, X } from 'lucide-react';
import { ActiveView, LayoutMode, ThemeMode } from '../types/kanban';

interface HeaderProps {
  theme: ThemeMode;
  layoutMode: LayoutMode;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenProjects: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onAddColumnClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  layoutMode,
  onChangeLayoutMode,
  activeView,
  onSelectView,
  onOpenProjects,
  onOpenTemplates,
  onOpenShortcuts,
  onAddColumnClick,
}) => {
  const isPsy = theme === 'psychedelic';
  const isMobileLayout = layoutMode === 'mobile';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobileLayout) {
      setMobileMenuOpen(false);
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [mobileMenuOpen]);

  return (
    <header
      ref={menuContainerRef}
      className="sticky top-0 z-30 shrink-0 border-b backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--header-border)',
      }}
    >
      <div
        className={`mx-auto flex max-w-[1600px] items-center justify-between gap-3 ${
          isMobileLayout ? 'h-14 px-3.5' : 'h-16 gap-5 px-4 sm:gap-8 sm:px-8'
        }`}
      >
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => {
            onSelectView('board');
            setMobileMenuOpen(false);
          }}
          className={`font-display cursor-pointer font-extrabold tracking-tight whitespace-nowrap shrink-0 transition-transform duration-150 hover:scale-[1.02] ${
            isMobileLayout ? 'text-lg' : 'text-xl'
          }`}
          style={{
            color: 'var(--text-on-canvas)',
            textShadow: isPsy ? '2px 2px 0px #ff2e93' : 'none',
          }}
        >
          CromaKanban
        </button>

        {/* Zone 2: Clean single-line text navigation links (Desktop Mode - default) */}
        {!isMobileLayout && (
          <nav className="no-scrollbar flex min-w-0 items-center gap-5 overflow-x-auto text-sm font-medium lg:gap-7">
            <button
              type="button"
              onClick={() => onSelectView('board')}
              className={`cursor-pointer py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeView === 'board'
                  ? 'underline decoration-2 underline-offset-8 font-semibold'
                  : 'opacity-75 hover:opacity-100 hover:underline underline-offset-8'
              }`}
              style={{ color: 'var(--text-on-canvas)' }}
            >
              Tablero
            </button>
            <button
              type="button"
              onClick={onOpenProjects}
              className="cursor-pointer py-1 whitespace-nowrap shrink-0 opacity-75 transition-opacity hover:opacity-100 hover:underline underline-offset-8"
              style={{ color: 'var(--text-on-canvas)' }}
            >
              Proyectos
            </button>
            <button
              type="button"
              onClick={() => onSelectView('summary')}
              className={`cursor-pointer py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeView === 'summary'
                  ? 'underline decoration-2 underline-offset-8 font-semibold'
                  : 'opacity-75 hover:opacity-100 hover:underline underline-offset-8'
              }`}
              style={{ color: 'var(--text-on-canvas)' }}
            >
              Resumen
            </button>
            <button
              type="button"
              onClick={onOpenTemplates}
              className="cursor-pointer py-1 whitespace-nowrap shrink-0 opacity-75 transition-opacity hover:opacity-100 hover:underline underline-offset-8"
              style={{ color: 'var(--text-on-canvas)' }}
            >
              Plantillas
            </button>
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="cursor-pointer py-1 whitespace-nowrap shrink-0 opacity-75 transition-opacity hover:opacity-100 hover:underline underline-offset-8"
              style={{ color: 'var(--text-on-canvas)' }}
            >
              Atajos
            </button>
          </nav>
        )}

        {/* Zone 3: Layout mode toggle + Primary CTA (+ mobile drawer trigger) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeLayoutMode(isMobileLayout ? 'desktop' : 'mobile')}
            aria-label={isMobileLayout ? 'Cambiar a modo ordenador' : 'Cambiar a modo móvil'}
            title={isMobileLayout ? 'Cambiar a modo ordenador' : 'Cambiar a modo móvil'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              isMobileLayout ? 'h-9' : 'h-10 px-3'
            }`}
            style={{
              backgroundColor: 'var(--control-bg)',
              border: `1px solid var(--control-border)`,
              color: 'var(--control-text)',
            }}
          >
            {isMobileLayout ? (
              <>
                <Monitor className="h-3.5 w-3.5 shrink-0" />
                <span>Ordenador</span>
              </>
            ) : (
              <>
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Móvil</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onAddColumnClick}
            className={`inline-flex cursor-pointer items-center rounded-lg font-semibold whitespace-nowrap shrink-0 transition-all duration-150 active:translate-y-[1px] ${
              isMobileLayout
                ? 'h-9 gap-1.5 px-3 text-xs'
                : 'h-10 gap-2 px-4 text-sm'
            }`}
            style={{
              backgroundColor: 'var(--cta-bg)',
              color: 'var(--cta-text)',
              border: isPsy ? '2px solid var(--cta-border)' : '1px solid transparent',
              boxShadow: 'var(--cta-shadow)',
            }}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>{isMobileLayout ? 'Columna' : 'Nueva columna'}</span>
          </button>

          {isMobileLayout && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg"
              style={{
                backgroundColor: 'var(--control-bg)',
                border: `1px solid var(--control-border)`,
                color: 'var(--control-text)',
              }}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileLayout && mobileMenuOpen && (
        <nav
          aria-label="Navegación móvil"
          className="border-t px-3.5 py-2.5"
          style={{
            backgroundColor: 'var(--modal-bg)',
            color: 'var(--modal-text)',
            borderColor: 'var(--header-border)',
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectView('board');
                setMobileMenuOpen(false);
              }}
              className="flex h-10 cursor-pointer items-center justify-center rounded-xl px-3 text-xs font-bold"
              style={{
                backgroundColor: activeView === 'board' ? 'var(--cta-bg)' : 'var(--modal-input-bg)',
                color: activeView === 'board' ? 'var(--cta-text)' : 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              Tablero
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectView('summary');
                setMobileMenuOpen(false);
              }}
              className="flex h-10 cursor-pointer items-center justify-center rounded-xl px-3 text-xs font-bold"
              style={{
                backgroundColor:
                  activeView === 'summary' ? 'var(--cta-bg)' : 'var(--modal-input-bg)',
                color: activeView === 'summary' ? 'var(--cta-text)' : 'var(--modal-text)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              Resumen
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProjects();
              }}
              className="flex h-10 cursor-pointer items-center justify-center rounded-xl px-3 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              Proyectos
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTemplates();
              }}
              className="flex h-10 cursor-pointer items-center justify-center rounded-xl px-3 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              Plantillas
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenShortcuts();
              }}
              className="col-span-2 flex h-9 cursor-pointer items-center justify-center rounded-xl px-3 text-xs font-medium opacity-80"
              style={{
                backgroundColor: 'var(--modal-input-bg)',
                border: `1px solid var(--modal-input-border)`,
              }}
            >
              Atajos de teclado
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
