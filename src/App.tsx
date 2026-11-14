import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGroup } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { AiBreakdownModal, AiGeneratedTaskPayload } from './components/AiBreakdownModal';
import { AiCommandAction, AiCommandModal } from './components/AiCommandModal';
import { CardModal } from './components/CardModal';
import { CardQuickMenuSheet } from './components/CardQuickMenuSheet';
import { Header } from './components/Header';
import { KanbanCard } from './components/KanbanCard';
import { KanbanColumn } from './components/KanbanColumn';
import { MobileCardActionBar } from './components/MobileCardActionBar';
import { NewColumnModal } from './components/NewColumnModal';
import { ProjectsModal } from './components/ProjectsModal';
import { PsychedelicBackdrop } from './components/PsychedelicBackdrop';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SummaryView } from './components/SummaryView';
import { TemplatesModal } from './components/TemplatesModal';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { BOARD_TEMPLATES, INITIAL_CARDS, INITIAL_COLUMNS } from './data/initialBoard';
import {
  ActiveView,
  BoardTemplate,
  COLUMN_ACCENTS,
  ColumnAccentId,
  KanbanCardItem,
  KanbanColumnItem,
  KanbanProject,
  LayoutMode,
  PriorityLevel,
  ThemeMode,
} from './types/kanban';

const STORAGE_KEYS = {
  projects: 'cromakanban_projects_v1',
  activeProjectId: 'cromakanban_active_project_v1',
  legacyColumns: 'cromakanban_columns_v1',
  legacyCards: 'cromakanban_cards_v1',
  theme: 'cromakanban_theme_v1',
  layoutMode: 'cromakanban_layout_mode_v1',
};

function loadInitialProjects(): KanbanProject[] {
  try {
    const rawProjects = localStorage.getItem(STORAGE_KEYS.projects);
    if (rawProjects) {
      const parsed = JSON.parse(rawProjects) as KanbanProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migrate legacy single-board data seamlessly if present
    const rawCols = localStorage.getItem(STORAGE_KEYS.legacyColumns);
    const rawCards = localStorage.getItem(STORAGE_KEYS.legacyCards);
    const cols = rawCols ? (JSON.parse(rawCols) as KanbanColumnItem[]) : INITIAL_COLUMNS;
    const cards = rawCards ? (JSON.parse(rawCards) as KanbanCardItem[]) : INITIAL_CARDS;

    return [
      {
        id: 'proj-default',
        name: 'Festival Sonoro',
        accent: 'magenta',
        columns: Array.isArray(cols) && cols.length > 0 ? cols : INITIAL_COLUMNS,
        cards: Array.isArray(cards) ? cards : INITIAL_CARDS,
        createdAt: Date.now(),
      },
    ];
  } catch {
    return [
      {
        id: 'proj-default',
        name: 'Festival Sonoro',
        accent: 'magenta',
        columns: INITIAL_COLUMNS,
        cards: INITIAL_CARDS,
        createdAt: Date.now(),
      },
    ];
  }
}

function loadActiveProjectId(projects: KanbanProject[]): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.activeProjectId);
    if (raw && projects.some((p) => p.id === raw)) {
      return raw;
    }
    return projects[0]?.id ?? 'proj-default';
  } catch {
    return projects[0]?.id ?? 'proj-default';
  }
}

function loadTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.theme);
    if (raw === 'psychedelic' || raw === 'dark' || raw === 'light') {
      return raw;
    }
    return 'psychedelic';
  } catch {
    return 'psychedelic';
  }
}

function loadLayoutMode(): LayoutMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.layoutMode);
    if (raw === 'mobile' || raw === 'desktop') {
      return raw;
    }
    return 'desktop';
  } catch {
    return 'desktop';
  }
}

interface DraggingCardMeta {
  cardId: string;
  width: number;
  initialX: number;
  initialY: number;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(loadLayoutMode);
  const [projects, setProjects] = useState<KanbanProject[]>(loadInitialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(() =>
    loadActiveProjectId(projects)
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  const columns = activeProject?.columns ?? INITIAL_COLUMNS;
  const cards = activeProject?.cards ?? [];

  // Scoped column/card updaters for the currently active project
  const setColumns = useCallback(
    (updater: KanbanColumnItem[] | ((prev: KanbanColumnItem[]) => KanbanColumnItem[])) => {
      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const nextCols =
            typeof updater === 'function' ? updater(proj.columns) : updater;
          return { ...proj, columns: nextCols };
        })
      );
    },
    [activeProject.id]
  );

  const setCards = useCallback(
    (updater: KanbanCardItem[] | ((prev: KanbanCardItem[]) => KanbanCardItem[])) => {
      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const nextCards =
            typeof updater === 'function' ? updater(proj.cards) : updater;
          return { ...proj, cards: nextCards };
        })
      );
    },
    [activeProject.id]
  );

  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');

  const [editingCard, setEditingCard] = useState<KanbanCardItem | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [quickMenuCardId, setQuickMenuCardId] = useState<string | null>(null);
  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiCommandModalOpen, setAiCommandModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [projectsCreateMode, setProjectsCreateMode] = useState(false);

  // Horizontal board scroll / grab-to-pan state
  const boardRef = useRef<HTMLElement | null>(null);
  const [isPanningBoard, setIsPanningBoard] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
  const scrollMetricsRafRef = useRef<number | null>(null);
  const panInertiaRef = useRef<number | null>(null);

  // Smooth zero-rerender Pointer Drag & Drop refs + minimal state
  const [draggingCardMeta, setDraggingCardMeta] = useState<DraggingCardMeta | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const hoveredColumnRef = useRef<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastSwapRef = useRef<{ targetId: string; time: number }>({ targetId: '', time: 0 });
  const dragPointerRef = useRef<{
    active: boolean;
    cardId: string;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
    currentTilt: number;
    targetTilt: number;
    dirtyHitTest: boolean;
  }>({
    active: false,
    cardId: '',
    clientX: 0,
    clientY: 0,
    offsetX: 0,
    offsetY: 0,
    currentTilt: 0,
    targetTilt: 0,
    dirtyHitTest: false,
  });

  // Column Drag & Drop State
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState<string | null>(null);

  // Toast / Undo State
  const [toastState, setToastState] = useState<{
    message: string;
    projectId?: string;
    columns?: KanbanColumnItem[];
    cards?: KanbanCardItem[];
    deletedProject?: KanbanProject;
  } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Refs for local file DB hydration and debounced persistence
  const isDbHydratedRef = useRef(false);
  const skipNextSyncRef = useRef(false);
  const hasMountedSyncRef = useRef(false);
  const dirtyBeforeHydrationRef = useRef(false);
  const hasPendingSyncRef = useRef(false);
  const latestPersistPayloadRef = useRef({
    projects,
    activeProjectId,
    theme,
  });
  latestPersistPayloadRef.current = { projects, activeProjectId, theme };

  const syncBoardToServer = useCallback(
    async (
      payload: { projects: KanbanProject[]; activeProjectId: string; theme: ThemeMode },
      keepalive = false
    ) => {
      try {
        const res = await fetch('/api/board', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive,
        });
        if (res.ok) {
          hasPendingSyncRef.current = false;
        }
      } catch {
        // Keep localStorage cache intact if server is temporarily unavailable
      }
    },
    []
  );

  // Sync theme attribute and .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.layoutMode, layoutMode);
    } catch {
      // Ignore storage quota errors
    }
    if (layoutMode === 'desktop') {
      setSelectedCardId(null);
    }
  }, [layoutMode]);

  // Hydrate from server local file DB on mount (or seed it from existing localStorage/initial data)
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const hydrateFromServerDb = async () => {
      try {
        const res = await fetch('/api/board', { signal: controller.signal });
        if (!res.ok) {
          isDbHydratedRef.current = true;
          return;
        }

        const data = (await res.json()) as {
          initialized?: boolean;
          projects?: KanbanProject[];
          activeProjectId?: string;
          theme?: ThemeMode;
        };

        if (cancelled) return;

        if (
          data.initialized &&
          Array.isArray(data.projects) &&
          data.projects.length > 0 &&
          !dirtyBeforeHydrationRef.current
        ) {
          const nextProjects = data.projects;
          const nextActiveId = nextProjects.some((p) => p.id === data.activeProjectId)
            ? (data.activeProjectId as string)
            : nextProjects[0].id;
          const nextTheme: ThemeMode =
            data.theme === 'dark' || data.theme === 'light' || data.theme === 'psychedelic'
              ? data.theme
              : 'psychedelic';

          skipNextSyncRef.current = true;
          isDbHydratedRef.current = true;
          setProjects(nextProjects);
          setActiveProjectId(nextActiveId);
          setTheme(nextTheme);
          return;
        }

        isDbHydratedRef.current = true;
        if (!data.initialized || dirtyBeforeHydrationRef.current) {
          await syncBoardToServer(latestPersistPayloadRef.current);
        }
      } catch {
        if (!cancelled) {
          isDbHydratedRef.current = true;
        }
      }
    };

    void hydrateFromServerDb();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [syncBoardToServer]);

  // Persist projects & activeProjectId locally and debounce-sync to server file DB
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEYS.activeProjectId, activeProjectId);
    } catch {
      // Ignore storage quota errors
    }

    if (!hasMountedSyncRef.current) {
      hasMountedSyncRef.current = true;
      return;
    }

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    if (!isDbHydratedRef.current) {
      dirtyBeforeHydrationRef.current = true;
      hasPendingSyncRef.current = true;
      return;
    }

    hasPendingSyncRef.current = true;
    const timer = window.setTimeout(() => {
      void syncBoardToServer({ projects, activeProjectId, theme });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [projects, activeProjectId, theme, syncBoardToServer]);

  // Flush any pending DB changes if the user closes or reloads the tab before the debounce completes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasPendingSyncRef.current || !isDbHydratedRef.current) return;
      void syncBoardToServer(latestPersistPayloadRef.current, true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncBoardToServer]);

  // Track board horizontal overflow & visible columns with rAF throttling + equality guards
  const updateBoardScrollMetrics = useCallback(() => {
    const el = boardRef.current;
    if (!el) return;

    const nextLeft = el.scrollLeft > 12;
    const nextRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 12;

    setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft));
    setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight));

    const containerRect = el.getBoundingClientRect();
    const colEls = el.querySelectorAll<HTMLElement>('[data-column-el-id]');
    const visible: string[] = [];
    colEls.forEach((colEl) => {
      const r = colEl.getBoundingClientRect();
      const overlap =
        Math.min(r.right, containerRect.right) - Math.max(r.left, containerRect.left);
      if (overlap > Math.min(120, r.width * 0.45)) {
        const id = colEl.getAttribute('data-column-el-id');
        if (id) visible.push(id);
      }
    });

    setVisibleColumnIds((prev) => {
      if (prev.length === visible.length && prev.every((v, i) => v === visible[i])) {
        return prev;
      }
      return visible;
    });
  }, []);

  useEffect(() => {
    if (activeView !== 'board') return;
    updateBoardScrollMetrics();
    const el = boardRef.current;
    if (!el) return;

    const onScroll = () => {
      if (scrollMetricsRafRef.current !== null) return;
      scrollMetricsRafRef.current = window.requestAnimationFrame(() => {
        scrollMetricsRafRef.current = null;
        updateBoardScrollMetrics();
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollMetricsRafRef.current !== null) {
        window.cancelAnimationFrame(scrollMetricsRafRef.current);
        scrollMetricsRafRef.current = null;
      }
    };
  }, [activeView, activeProject.id, columns.length, updateBoardScrollMetrics]);

  // 60/120fps rAF loop while dragging a card
  useEffect(() => {
    if (!draggingCardMeta) return;
    let rafId = 0;

    const tick = () => {
      const d = dragPointerRef.current;
      if (!d.active) return;

      d.currentTilt += (d.targetTilt - d.currentTilt) * 0.22;
      d.targetTilt *= 0.86;

      if (overlayRef.current) {
        const tx = d.clientX - d.offsetX;
        const ty = d.clientY - d.offsetY;
        overlayRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.03) rotate(${d.currentTilt.toFixed(2)}deg)`;
      }

      const el = boardRef.current;
      let edgeScrolled = false;
      if (el) {
        const rect = el.getBoundingClientRect();
        const edgeZone = window.innerWidth < 640 ? 44 : 90;
        if (d.clientX < rect.left + edgeZone && el.scrollLeft > 0) {
          const factor = 1 - Math.max(0, d.clientX - rect.left) / edgeZone;
          el.scrollLeft -= Math.ceil(4 + factor * 14);
          edgeScrolled = true;
        } else if (
          d.clientX > rect.right - edgeZone &&
          el.scrollLeft + el.clientWidth < el.scrollWidth
        ) {
          const factor = 1 - Math.max(0, rect.right - d.clientX) / edgeZone;
          el.scrollLeft += Math.ceil(4 + factor * 14);
          edgeScrolled = true;
        }
      }

      if (d.dirtyHitTest || edgeScrolled) {
        d.dirtyHitTest = false;
        const elements = document.elementsFromPoint(d.clientX, d.clientY);
        const colEl = elements.find((node) => node.hasAttribute('data-drop-column-id')) as
          | HTMLElement
          | undefined;
        const targetColId = colEl?.getAttribute('data-drop-column-id') ?? null;

        if (targetColId !== hoveredColumnRef.current) {
          hoveredColumnRef.current = targetColId;
          setHoveredColumnId(targetColId);
        }

        const hoveredCardEl = elements.find((node) => {
          const id = node.getAttribute('data-drop-card-id');
          return Boolean(id && id !== d.cardId);
        }) as HTMLElement | undefined;

        const now = performance.now();

        if (hoveredCardEl) {
          const targetCardId = hoveredCardEl.getAttribute('data-drop-card-id')!;
          const cardRect = hoveredCardEl.getBoundingClientRect();
          const insertBefore = d.clientY < cardRect.top + cardRect.height / 2;

          if (
            lastSwapRef.current.targetId !== targetCardId ||
            now - lastSwapRef.current.time >= 120
          ) {
            setCards((prev) => {
              const movingIdx = prev.findIndex((c) => c.id === d.cardId);
              const targetIdx = prev.findIndex((c) => c.id === targetCardId);
              if (movingIdx === -1 || targetIdx === -1) return prev;

              const targetCard = prev[targetIdx];
              const movingCard = prev[movingIdx];
              const remaining = prev.filter((c) => c.id !== d.cardId);
              const newTargetIdx = remaining.findIndex((c) => c.id === targetCardId);
              const destIdx = insertBefore ? newTargetIdx : newTargetIdx + 1;

              if (movingCard.columnId === targetCard.columnId && movingIdx === destIdx) {
                return prev;
              }

              lastSwapRef.current = { targetId: targetCardId, time: now };
              const next = [...remaining];
              next.splice(destIdx, 0, { ...movingCard, columnId: targetCard.columnId });
              return next;
            });
          }
        } else if (targetColId) {
          setCards((prev) => {
            const movingCard = prev.find((c) => c.id === d.cardId);
            if (!movingCard || movingCard.columnId === targetColId) return prev;
            const remaining = prev.filter((c) => c.id !== d.cardId);
            return [...remaining, { ...movingCard, columnId: targetColId }];
          });
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [draggingCardMeta, setCards]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isTyping) return;
      if (
        editingCard ||
        newColumnOpen ||
        templatesOpen ||
        shortcutsOpen ||
        aiModalOpen ||
        aiCommandModalOpen ||
        projectsModalOpen
      ) {
        return;
      }

      if (e.key === '1') setTheme('psychedelic');
      if (e.key === '2') setTheme('dark');
      if (e.key === '3') setTheme('light');
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setAiModalOpen(true);
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAiCommandModalOpen(true);
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNewColumnOpen(true);
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchEl = document.querySelector<HTMLInputElement>(
          'input[aria-label="Buscar tarjetas o etiquetas"]'
        );
        searchEl?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    editingCard,
    newColumnOpen,
    templatesOpen,
    shortcutsOpen,
    aiModalOpen,
    aiCommandModalOpen,
    projectsModalOpen,
  ]);

  const showUndo = useCallback(
    (message: string, prevCols: KanbanColumnItem[], prevCards: KanbanCardItem[]) => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      setToastState({
        message,
        projectId: activeProject.id,
        columns: prevCols,
        cards: prevCards,
      });
      undoTimerRef.current = window.setTimeout(() => {
        setToastState(null);
      }, 6000);
    },
    [activeProject.id]
  );

  const showNotice = useCallback((message: string) => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setToastState({ message });
    undoTimerRef.current = window.setTimeout(() => {
      setToastState(null);
    }, 5000);
  }, []);

  const handleUndo = () => {
    if (!toastState) return;
    if (toastState.deletedProject) {
      const restored = toastState.deletedProject;
      setProjects((prev) => [...prev, restored]);
      setActiveProjectId(restored.id);
    } else if (toastState.columns && toastState.cards && toastState.projectId) {
      const targetProjId = toastState.projectId;
      const restoredCols = toastState.columns;
      const restoredCards = toastState.cards;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjId ? { ...p, columns: restoredCols, cards: restoredCards } : p
        )
      );
    }
    setToastState(null);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
  };

  // Project CRUD
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setSearchQuery('');
    setPriorityFilter('all');
    setEditingCard(null);
    setSelectedCardId(null);
    setQuickMenuCardId(null);
    if (boardRef.current) {
      boardRef.current.scrollLeft = 0;
    }
  };

  const handleCreateProject = ({
    name,
    accent,
    templateId,
  }: {
    name: string;
    accent: ColumnAccentId;
    templateId: string;
  }) => {
    const tpl =
      BOARD_TEMPLATES.find((t) => t.id === templateId) ??
      BOARD_TEMPLATES[BOARD_TEMPLATES.length - 1];

    const now = Date.now();
    const colIdMap = new Map<string, string>();
    const clonedCols: KanbanColumnItem[] = tpl.columns.map((c, idx) => {
      const newId = `col-${now}-${idx}-${Math.random().toString(36).slice(2, 5)}`;
      colIdMap.set(c.id, newId);
      return { ...c, id: newId };
    });

    const clonedCards: KanbanCardItem[] = tpl.cards.map((card, idx) => ({
      ...card,
      id: `card-${now}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      columnId: colIdMap.get(card.columnId) ?? clonedCols[0]?.id ?? '',
      checklist: card.checklist.map((step, sIdx) => ({
        ...step,
        id: `chk-${now}-${idx}-${sIdx}`,
      })),
      createdAt: now + idx,
    }));

    const newProj: KanbanProject = {
      id: `proj-${now}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      accent,
      columns: clonedCols,
      cards: clonedCards,
      createdAt: now,
    };

    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setActiveView('board');
    setSearchQuery('');
    setPriorityFilter('all');
    setSelectedCardId(null);
    setQuickMenuCardId(null);
    showNotice(`Proyecto "${name}" creado y abierto`);
  };

  const handleRenameProject = (projectId: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, name } : p)));
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0].id);
    }

    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setToastState({
      message: `Proyecto "${target.name}" eliminado`,
      deletedProject: target,
    });
    undoTimerRef.current = window.setTimeout(() => {
      setToastState(null);
    }, 6000);
  };

  // Filtered cards
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter((card) => {
      if (priorityFilter !== 'all' && card.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.category.toLowerCase().includes(q)
      );
    });
  }, [cards, searchQuery, priorityFilter]);

  const hasActiveFilter = searchQuery.trim() !== '' || priorityFilter !== 'all';

  const scrollToColumn = useCallback((columnId: string) => {
    const el = boardRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-column-el-id="${columnId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const scrollBoardBy = (delta: number) => {
    const el = boardRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleBoardPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        '[data-card-interactive="true"], button, input, textarea, select, a, [data-column-header-drag="true"]'
      )
    ) {
      return;
    }

    const boardEl = boardRef.current;
    if (!boardEl) return;

    if (panInertiaRef.current) {
      window.cancelAnimationFrame(panInertiaRef.current);
      panInertiaRef.current = null;
    }

    const startX = e.clientX;
    const startScrollLeft = boardEl.scrollLeft;
    let lastX = e.clientX;
    let lastTime = performance.now();
    let velocity = 0;
    let hasMoved = false;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      if (!hasMoved && Math.abs(dx) > 4) {
        hasMoved = true;
        setIsPanningBoard(true);
      }
      if (!hasMoved) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocity = (lastX - moveEvt.clientX) / dt;
      lastX = moveEvt.clientX;
      lastTime = now;

      boardEl.scrollLeft = startScrollLeft - dx;
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setIsPanningBoard(false);

      if (!hasMoved || Math.abs(velocity) < 0.08) return;

      let v = velocity * 16;
      const glide = () => {
        if (Math.abs(v) < 0.35) {
          panInertiaRef.current = null;
          return;
        }
        boardEl.scrollLeft += v;
        v *= 0.91;
        panInertiaRef.current = window.requestAnimationFrame(glide);
      };
      panInertiaRef.current = window.requestAnimationFrame(glide);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { once: true });
    window.addEventListener('pointercancel', onPointerUp, { once: true });
  };

  // Column CRUD
  const handleCreateColumn = (title: string, accent: ColumnAccentId) => {
    const newCol: KanbanColumnItem = {
      id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      accent,
    };
    setColumns((prev) => [...prev, newCol]);
    setActiveView('board');
    window.setTimeout(() => scrollToColumn(newCol.id), 90);
  };

  const handleRenameColumn = useCallback(
    (columnId: string, title: string) => {
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, title } : c)));
    },
    [setColumns]
  );

  const handleChangeColumnAccent = useCallback(
    (columnId: string, accent: ColumnAccentId) => {
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, accent } : c)));
    },
    [setColumns]
  );

  const handleMoveColumn = useCallback(
    (columnId: string, direction: -1 | 1) => {
      setColumns((prev) => {
        const idx = prev.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(idx, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
    },
    [setColumns]
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;
      const prevCols = columns;
      const prevCards = cards;
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setCards((prev) => prev.filter((c) => c.columnId !== columnId));
      showUndo(`Columna "${col.title}" eliminada`, prevCols, prevCards);
    },
    [columns, cards, setColumns, setCards, showUndo]
  );

  // Card CRUD
  const handleAddCard = useCallback(
    (columnId: string, payload: { title: string; category: string; priority: PriorityLevel }) => {
      const newCard: KanbanCardItem = {
        id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        columnId,
        title: payload.title,
        description: '',
        category: payload.category,
        priority: payload.priority,
        dueDate: '',
        checklist: [],
        createdAt: Date.now(),
      };
      setCards((prev) => [...prev, newCard]);
    },
    [setCards]
  );

  const handleSaveCard = (updated: KanbanCardItem) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingCard(null);
  };

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      const target = cards.find((c) => c.id === cardId);
      if (!target) return;
      const prevCols = columns;
      const prevCards = cards;
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      setEditingCard(null);
      setSelectedCardId((prev) => (prev === cardId ? null : prev));
      setQuickMenuCardId((prev) => (prev === cardId ? null : prev));
      showUndo(`Tarjeta "${target.title}" eliminada`, prevCols, prevCards);
    },
    [cards, columns, setCards, showUndo]
  );

  const moveCardWithinColumn = useCallback(
    (cardId: string, direction: -1 | 1) => {
      setCards((prev) => {
        const target = prev.find((c) => c.id === cardId);
        if (!target) return prev;
        const colIndices: number[] = [];
        prev.forEach((c, idx) => {
          if (c.columnId === target.columnId) {
            colIndices.push(idx);
          }
        });
        const pos = colIndices.findIndex((idx) => prev[idx].id === cardId);
        const nextPos = pos + direction;
        if (pos === -1 || nextPos < 0 || nextPos >= colIndices.length) return prev;
        const fromIdx = colIndices[pos];
        const toIdx = colIndices[nextPos];
        const next = [...prev];
        const temp = next[fromIdx];
        next[fromIdx] = next[toIdx];
        next[toIdx] = temp;
        return next;
      });
    },
    [setCards]
  );

  const moveCardToColumn = useCallback(
    (cardId: string, targetColumnId: string) => {
      setCards((prev) => {
        const movingCard = prev.find((c) => c.id === cardId);
        if (!movingCard || movingCard.columnId === targetColumnId) return prev;
        const remaining = prev.filter((c) => c.id !== cardId);
        return [...remaining, { ...movingCard, columnId: targetColumnId }];
      });
      window.setTimeout(() => {
        scrollToColumn(targetColumnId);
      }, 60);
    },
    [setCards, scrollToColumn]
  );

  // Smooth zero-rerender Pointer Drag-and-Drop for Cards (supports desktop, grip handle & 280ms mobile long-press)
  const handleCardPointerStart = useCallback(
    (e: React.PointerEvent<HTMLElement>, card: KanbanCardItem) => {
      if (e.button !== 0) return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button')) return;

      const isGripHandle = Boolean(targetEl?.closest('[data-drag-handle="true"]'));
      const isTouch = e.pointerType === 'touch';
      const cardEl = e.currentTarget;
      const rect = cardEl.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const offsetX = startX - rect.left;
      const offsetY = startY - rect.top;
      let lastX = startX;
      let lastY = startY;
      let prevTiltX = startX;
      let isDragging = false;
      let cancelledBeforeHold = false;
      let longPressTimer: number | null = null;
      let touchMovePreventAttached = false;

      const preventNativeTouchScroll = (touchEvt: TouchEvent) => {
        touchEvt.preventDefault();
      };

      const activateDrag = (clientX: number, clientY: number) => {
        if (isDragging) return;
        isDragging = true;
        if (isTouch && !touchMovePreventAttached) {
          window.addEventListener('touchmove', preventNativeTouchScroll, { passive: false });
          touchMovePreventAttached = true;
        }
        dragPointerRef.current = {
          active: true,
          cardId: card.id,
          clientX,
          clientY,
          offsetX,
          offsetY,
          currentTilt: 0,
          targetTilt: 0,
          dirtyHitTest: true,
        };
        setDraggingCardMeta({
          cardId: card.id,
          width: rect.width,
          initialX: clientX - offsetX,
          initialY: clientY - offsetY,
        });
      };

      if (isTouch && !isGripHandle) {
        longPressTimer = window.setTimeout(() => {
          longPressTimer = null;
          if (cancelledBeforeHold) return;
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(18);
          }
          activateDrag(lastX, lastY);
        }, 280);
      }

      const onPointerMove = (moveEvt: PointerEvent) => {
        lastX = moveEvt.clientX;
        lastY = moveEvt.clientY;
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        const dist = Math.hypot(dx, dy);

        if (isTouch && !isGripHandle && !isDragging) {
          if (dist > 8) {
            cancelledBeforeHold = true;
            if (longPressTimer !== null) {
              window.clearTimeout(longPressTimer);
              longPressTimer = null;
            }
            window.removeEventListener('pointermove', onPointerMove);
          }
          return;
        }

        if (!isDragging && dist > 6) {
          activateDrag(moveEvt.clientX, moveEvt.clientY);
        }

        if (!isDragging) return;

        const vx = moveEvt.clientX - prevTiltX;
        prevTiltX = moveEvt.clientX;
        dragPointerRef.current.clientX = moveEvt.clientX;
        dragPointerRef.current.clientY = moveEvt.clientY;
        dragPointerRef.current.targetTilt = Math.max(-5, Math.min(5, vx * 0.4));
        dragPointerRef.current.dirtyHitTest = true;
      };

      const cleanup = () => {
        if (longPressTimer !== null) {
          window.clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (touchMovePreventAttached) {
          window.removeEventListener('touchmove', preventNativeTouchScroll);
          touchMovePreventAttached = false;
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        dragPointerRef.current.active = false;
        hoveredColumnRef.current = null;
        setDraggingCardMeta(null);
        setHoveredColumnId(null);
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        const wasDragging = isDragging;
        const wasCancelled = cancelledBeforeHold;
        const totalMove = Math.hypot(upEvt.clientX - startX, upEvt.clientY - startY);
        cleanup();
        if (!wasDragging && !wasCancelled && totalMove < 10) {
          setSelectedCardId(null);
          setEditingCard(card);
        }
      };

      const onPointerCancel = () => {
        cleanup();
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerCancel, { once: true });
    },
    []
  );

  // Column Drag & Drop Handlers (HTML5 drag on column header)
  const handleColumnDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>, columnId: string) => {
      setDraggedColumnId(columnId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', columnId);
    },
    []
  );

  const handleDragOverColumn = useCallback(
    (e: React.DragEvent<HTMLElement>, columnId: string) => {
      if (!draggedColumnId) return;
      e.preventDefault();
      setDropTargetColumnId((prev) => (prev === columnId ? prev : columnId));
    },
    [draggedColumnId]
  );

  const handleDropOnColumn = useCallback(
    (e: React.DragEvent<HTMLElement>, targetColumnId: string) => {
      e.preventDefault();
      if (draggedColumnId && draggedColumnId !== targetColumnId) {
        setColumns((prev) => {
          const fromIdx = prev.findIndex((c) => c.id === draggedColumnId);
          const toIdx = prev.findIndex((c) => c.id === targetColumnId);
          if (fromIdx === -1 || toIdx === -1) return prev;
          const next = [...prev];
          const [moved] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, moved);
          return next;
        });
      }
      setDraggedColumnId(null);
      setDropTargetColumnId(null);
    },
    [draggedColumnId, setColumns]
  );

  const handleApplyTemplate = (tpl: BoardTemplate) => {
    const prevCols = columns;
    const prevCards = cards;
    setColumns(tpl.columns);
    setCards(tpl.cards);
    setActiveView('board');
    showUndo(`Plantilla "${tpl.name}" aplicada en "${activeProject.name}"`, prevCols, prevCards);
  };

  const defaultPendingColumnId = useMemo(() => {
    if (columns.length === 0) return 'new-pending';
    const match = columns.find((col) =>
      /pendient|por hacer|backlog|ideas|todo/i.test(col.title)
    );
    return match?.id ?? columns[0].id;
  }, [columns]);

  const handleAiTasksGenerated = (columnId: string, tasks: AiGeneratedTaskPayload[]) => {
    const prevCols = columns;
    const prevCards = cards;
    let targetColId = columnId;

    if (targetColId === 'new-pending' || !columns.some((c) => c.id === targetColId)) {
      const createdCol: KanbanColumnItem = {
        id: `col-${Date.now()}`,
        title: 'Pendientes',
        accent: 'violet',
      };
      targetColId = createdCol.id;
      setColumns((prev) => [createdCol, ...prev]);
    }

    const baseTime = Date.now();
    const newCards: KanbanCardItem[] = tasks.map((task, idx) => ({
      id: `card-ai-${baseTime}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      columnId: targetColId,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      dueDate: '',
      checklist: task.checklist.map((step, sIdx) => ({
        id: `chk-ai-${baseTime}-${idx}-${sIdx}`,
        text: step,
        done: false,
      })),
      createdAt: baseTime + idx,
    }));

    setCards((prev) => [...prev, ...newCards]);
    setActiveView('board');

    const targetColName =
      columns.find((c) => c.id === targetColId)?.title ?? 'Pendientes';
    showUndo(
      `${newCards.length} ${newCards.length === 1 ? 'tarea agregada' : 'tareas agregadas'} a "${targetColName}"`,
      prevCols,
      prevCards
    );
    window.setTimeout(() => scrollToColumn(targetColId), 90);
  };

  const handleExecuteAiActions = (
    actions: AiCommandAction[],
    reply: string
  ): boolean => {
    if (!actions || actions.length === 0) return false;

    const prevCols = columns;
    const prevCards = cards;

    let nextCols = [...columns];
    let nextCards = [...cards];
    let boardMutated = false;
    let projectActionExecuted = false;
    let themeChanged = false;
    const summaryParts: string[] = [];

    for (const action of actions) {
      const args = action.args ?? {};

      if (action.name === 'createProject' && typeof args.name === 'string') {
        const name = args.name.trim();
        const validAccents: ColumnAccentId[] = [
          'acid',
          'magenta',
          'cyan',
          'tangerine',
          'violet',
          'emerald',
        ];
        const accent = validAccents.includes(args.accent as ColumnAccentId)
          ? (args.accent as ColumnAccentId)
          : 'cyan';
        if (name) {
          handleCreateProject({ name, accent, templateId: 'tpl-empty' });
          projectActionExecuted = true;
          summaryParts.push(`Proyecto "${name}" creado`);
        }
      } else if (action.name === 'switchProject' && typeof args.projectId === 'string') {
        const target = projects.find((p) => p.id === args.projectId);
        if (target) {
          handleSelectProject(target.id);
          projectActionExecuted = true;
          summaryParts.push(`Cambiado a "${target.name}"`);
        }
      } else if (action.name === 'deleteCards' && Array.isArray(args.cardIds)) {
        const idSet = new Set(args.cardIds.map(String));
        const beforeCount = nextCards.length;
        nextCards = nextCards.filter((c) => !idSet.has(c.id));
        const removed = beforeCount - nextCards.length;
        if (removed > 0) {
          boardMutated = true;
          summaryParts.push(`${removed} eliminada(s)`);
        }
      } else if (
        action.name === 'moveCards' &&
        Array.isArray(args.cardIds) &&
        typeof args.targetColumnId === 'string'
      ) {
        const targetCol = nextCols.find((c) => c.id === args.targetColumnId);
        if (targetCol) {
          const idSet = new Set(args.cardIds.map(String));
          let movedCount = 0;
          nextCards = nextCards.map((c) => {
            if (idSet.has(c.id) && c.columnId !== targetCol.id) {
              movedCount++;
              return { ...c, columnId: targetCol.id };
            }
            return c;
          });
          if (movedCount > 0) {
            boardMutated = true;
            summaryParts.push(`${movedCount} movida(s) a "${targetCol.title}"`);
          }
        }
      } else if (action.name === 'updateCards' && Array.isArray(args.updates)) {
        let updatedCount = 0;
        const updateMap = new Map<string, Record<string, unknown>>();
        for (const u of args.updates) {
          if (u && typeof u === 'object' && typeof (u as Record<string, unknown>).cardId === 'string') {
            updateMap.set(String((u as Record<string, unknown>).cardId), u as Record<string, unknown>);
          }
        }
        nextCards = nextCards.map((c) => {
          const patch = updateMap.get(c.id);
          if (!patch) return c;
          updatedCount++;
          const nextPriority =
            patch.priority === 'high' || patch.priority === 'medium' || patch.priority === 'low'
              ? patch.priority
              : c.priority;
          return {
            ...c,
            title: typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim() : c.title,
            description:
              typeof patch.description === 'string' ? patch.description.trim() : c.description,
            category: typeof patch.category === 'string' ? patch.category.trim() : c.category,
            priority: nextPriority,
            dueDate: typeof patch.dueDate === 'string' ? patch.dueDate : c.dueDate,
          };
        });
        if (updatedCount > 0) {
          boardMutated = true;
          summaryParts.push(`${updatedCount} actualizada(s)`);
        }
      } else if (action.name === 'createCards' && Array.isArray(args.tasks)) {
        let targetColId =
          typeof args.columnId === 'string' && nextCols.some((c) => c.id === args.columnId)
            ? args.columnId
            : defaultPendingColumnId;

        if (!nextCols.some((c) => c.id === targetColId)) {
          const fallbackCol: KanbanColumnItem = {
            id: `col-${Date.now()}`,
            title: 'Pendientes',
            accent: 'violet',
          };
          targetColId = fallbackCol.id;
          nextCols = [fallbackCol, ...nextCols];
        }

        const baseTime = Date.now();
        const created: KanbanCardItem[] = args.tasks
          .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
          .map((t, idx) => {
            const pr = String(t.priority ?? 'medium');
            const priority: PriorityLevel = pr === 'high' || pr === 'low' ? pr : 'medium';
            const checklistRaw = Array.isArray(t.checklist) ? t.checklist : [];
            return {
              id: `card-ai-${baseTime}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              columnId: targetColId,
              title: String(t.title ?? 'Nueva tarea').trim() || 'Nueva tarea',
              description: String(t.description ?? '').trim(),
              category: String(t.category ?? 'General').trim(),
              priority,
              dueDate: '',
              checklist: checklistRaw
                .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                .map((s, sIdx) => ({
                  id: `chk-ai-${baseTime}-${idx}-${sIdx}`,
                  text: s.trim(),
                  done: false,
                })),
              createdAt: baseTime + idx,
            };
          });

        if (created.length > 0) {
          nextCards = [...nextCards, ...created];
          boardMutated = true;
          summaryParts.push(`${created.length} creada(s)`);
        }
      } else if (action.name === 'createColumn' && typeof args.title === 'string') {
        const title = args.title.trim();
        const validAccents: ColumnAccentId[] = [
          'acid',
          'magenta',
          'cyan',
          'tangerine',
          'violet',
          'emerald',
        ];
        const accent = validAccents.includes(args.accent as ColumnAccentId)
          ? (args.accent as ColumnAccentId)
          : 'cyan';
        if (title) {
          nextCols = [
            ...nextCols,
            {
              id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              title,
              accent,
            },
          ];
          boardMutated = true;
          summaryParts.push(`Columna "${title}" creada`);
        }
      } else if (
        action.name === 'renameColumn' &&
        typeof args.columnId === 'string' &&
        typeof args.newTitle === 'string'
      ) {
        const newTitle = args.newTitle.trim();
        if (newTitle && nextCols.some((c) => c.id === args.columnId)) {
          nextCols = nextCols.map((c) =>
            c.id === args.columnId ? { ...c, title: newTitle } : c
          );
          boardMutated = true;
          summaryParts.push(`Columna renombrada a "${newTitle}"`);
        }
      } else if (action.name === 'deleteColumn' && typeof args.columnId === 'string') {
        const col = nextCols.find((c) => c.id === args.columnId);
        if (col) {
          nextCols = nextCols.filter((c) => c.id !== col.id);
          nextCards = nextCards.filter((c) => c.columnId !== col.id);
          boardMutated = true;
          summaryParts.push(`Columna "${col.title}" eliminada`);
        }
      } else if (action.name === 'setTheme' && typeof args.theme === 'string') {
        if (args.theme === 'psychedelic' || args.theme === 'dark' || args.theme === 'light') {
          setTheme(args.theme);
          themeChanged = true;
          const themeNames: Record<ThemeMode, string> = {
            psychedelic: 'Psicodélico',
            dark: 'Oscuro',
            light: 'Claro',
          };
          summaryParts.push(`Tema cambiado a ${themeNames[args.theme]}`);
        }
      }
    }

    if (boardMutated) {
      setColumns(nextCols);
      setCards(nextCards);
      setActiveView('board');
      showUndo(
        reply || `IA: ${summaryParts.join(' · ') || 'Tablero actualizado'}`,
        prevCols,
        prevCards
      );
      return true;
    }

    if (projectActionExecuted || themeChanged) {
      showNotice(reply || `IA: ${summaryParts.join(' · ')}`);
      return true;
    }

    return false;
  };

  const isPsy = theme === 'psychedelic';
  const activeOverlayCard = draggingCardMeta
    ? cards.find((c) => c.id === draggingCardMeta.cardId) ?? null
    : null;
  const activeOverlayColumn = activeOverlayCard
    ? columns.find((col) => col.id === activeOverlayCard.columnId) ?? null
    : null;

  const selectedCard = selectedCardId
    ? cards.find((c) => c.id === selectedCardId) ?? null
    : null;
  const selectedCardMetrics = useMemo(() => {
    if (!selectedCard) return { index: 0, total: 0 };
    const colCards = cards.filter((c) => c.columnId === selectedCard.columnId);
    return {
      index: Math.max(
        0,
        colCards.findIndex((c) => c.id === selectedCard.id)
      ),
      total: colCards.length,
    };
  }, [selectedCard, cards]);

  const quickMenuCard = quickMenuCardId
    ? cards.find((c) => c.id === quickMenuCardId) ?? null
    : null;
  const quickMenuCardMetrics = useMemo(() => {
    if (!quickMenuCard) return { index: 0, total: 0 };
    const colCards = cards.filter((c) => c.columnId === quickMenuCard.columnId);
    return {
      index: Math.max(
        0,
        colCards.findIndex((c) => c.id === quickMenuCard.id)
      ),
      total: colCards.length,
    };
  }, [quickMenuCard, cards]);

  const hasAnyModalOpen = Boolean(
    editingCard ||
      newColumnOpen ||
      templatesOpen ||
      shortcutsOpen ||
      aiModalOpen ||
      aiCommandModalOpen ||
      projectsModalOpen ||
      quickMenuCard
  );

  return (
    <div
      className={`relative flex flex-col ${
        activeView === 'board' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'
      } ${draggingCardMeta || isPanningBoard ? 'select-none' : ''}`}
    >
      <PsychedelicBackdrop active={isPsy} />

      <Header
        theme={theme}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenProjects={() => {
          setProjectsCreateMode(false);
          setProjectsModalOpen(true);
        }}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onAddColumnClick={() => setNewColumnOpen(true)}
      />

      <WorkspaceToolbar
        theme={theme}
        layoutMode={layoutMode}
        onChangeTheme={setTheme}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onOpenNewProject={() => {
          setProjectsCreateMode(true);
          setProjectsModalOpen(true);
        }}
        onOpenProjectsManager={() => {
          setProjectsCreateMode(false);
          setProjectsModalOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        totalCards={cards.length}
        visibleCards={filteredCards.length}
        totalColumns={columns.length}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenAiBreakdown={() => setAiModalOpen(true)}
        onOpenAiCommand={() => setAiCommandModalOpen(true)}
      />

      {activeView === 'summary' ? (
        <SummaryView
          columns={columns}
          cards={cards}
          theme={theme}
          onBackToBoard={() => setActiveView('board')}
          onOpenCard={(card) => setEditingCard(card)}
        />
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Quick Column Navigator Strip */}
          <div
            className={`flex shrink-0 items-center justify-between gap-3 border-b ${
              layoutMode === 'mobile' ? 'px-3.5 py-1.5' : 'px-4 py-2 sm:px-8'
            }`}
            style={{
              backgroundColor: 'var(--toolbar-bg)',
              borderColor: 'var(--header-border)',
            }}
          >
            <div
              className={`no-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto py-0.5 ${
                layoutMode === 'mobile' ? 'gap-3.5' : 'gap-4'
              }`}
            >
              {columns.map((col) => {
                const count = filteredCards.filter((c) => c.columnId === col.id).length;
                const isVisible = visibleColumnIds.includes(col.id);
                const accent = isPsy
                  ? COLUMN_ACCENTS[col.accent].psychedelicHex
                  : COLUMN_ACCENTS[col.accent].standardHex;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => scrollToColumn(col.id)}
                    className={`group flex shrink-0 cursor-pointer items-center border-b-2 text-xs whitespace-nowrap transition-opacity ${
                      layoutMode === 'mobile' ? 'gap-1.5 py-1.5' : 'gap-2 py-1'
                    } ${
                      isVisible ? 'font-bold opacity-100' : 'font-medium opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      color: 'var(--text-on-canvas)',
                      borderColor: isVisible ? accent : 'transparent',
                    }}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span>{col.title}</span>
                    <span
                      className="font-mono-tabular opacity-75"
                      style={{ color: 'var(--text-on-canvas-muted)' }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {layoutMode === 'desktop' && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollBoardBy(-348)}
                  disabled={!canScrollLeft}
                  aria-label="Desplazar tablero a la izquierda"
                  title="Ver columnas anteriores"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: 'var(--control-bg)',
                    border: `1px solid var(--control-border)`,
                    color: 'var(--control-text)',
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollBoardBy(348)}
                  disabled={!canScrollRight}
                  aria-label="Desplazar tablero a la derecha"
                  title="Ver siguientes columnas"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: 'var(--control-bg)',
                    border: `1px solid var(--control-border)`,
                    color: 'var(--control-text)',
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Floating Edge Navigation Arrows (Desktop Mode) */}
          {layoutMode === 'desktop' && canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollBoardBy(-360)}
              aria-label="Ver columnas a la izquierda"
              className="fixed top-1/2 left-3 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: 'var(--card-bg)',
                color: 'var(--card-text)',
                border: `var(--card-border-width) solid var(--card-border)`,
                boxShadow: isPsy ? '4px 4px 0px #00F5D4' : '0 8px 20px rgba(0,0,0,0.28)',
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {layoutMode === 'desktop' && canScrollRight && (
            <button
              type="button"
              onClick={() => scrollBoardBy(360)}
              aria-label="Ver columnas a la derecha"
              className="fixed top-1/2 right-3 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: 'var(--card-bg)',
                color: 'var(--card-text)',
                border: `var(--card-border-width) solid var(--card-border)`,
                boxShadow: isPsy ? '4px 4px 0px #CCFF00' : '0 8px 20px rgba(0,0,0,0.28)',
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {hasActiveFilter && filteredCards.length === 0 && (
            <div className="shrink-0 px-3.5 pt-3 sm:px-8 sm:pt-4">
              <div
                className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--card-text)',
                  border: `var(--card-border-width) solid var(--card-border)`,
                  boxShadow: isPsy ? '5px 5px 0px #FF2E93' : 'var(--card-shadow)',
                }}
              >
                <div>
                  <p className="font-display text-sm font-bold">
                    Ninguna tarjeta coincide con los filtros actuales
                  </p>
                  <p className="text-xs" style={{ color: 'var(--card-text-muted)' }}>
                    Prueba otra búsqueda o limpia el filtro de prioridad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('all');
                  }}
                  className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--cta-bg)',
                    color: 'var(--cta-text)',
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {/* Grab-to-pan scrollable Kanban canvas */}
          <main
            ref={boardRef}
            onPointerDown={handleBoardPointerDown}
            className={`kanban-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden ${
              layoutMode === 'mobile'
                ? `scroll-px-3.5 px-3.5 pt-3 ${
                    selectedCard && activeView === 'board' && !hasAnyModalOpen ? 'pb-28' : 'pb-3'
                  } ${!draggingCardMeta ? 'snap-x snap-mandatory' : 'touch-none'}`
                : `px-4 py-4 sm:px-8 sm:py-6 ${draggingCardMeta ? 'touch-none' : ''}`
            } ${isPanningBoard ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <LayoutGroup id={activeProject.id}>
              <div
                className={`flex h-full min-w-max items-start ${
                  layoutMode === 'mobile' ? 'gap-3.5 pr-4 pb-1' : 'gap-5 pr-12 pb-4'
                }`}
              >
                {columns.map((col, index) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    cards={filteredCards.filter((c) => c.columnId === col.id)}
                    theme={theme}
                    layoutMode={layoutMode}
                    columnIndex={index}
                    totalColumns={columns.length}
                    draggedCardId={draggingCardMeta?.cardId ?? null}
                    selectedCardId={selectedCard?.id ?? null}
                    isCardDragging={Boolean(draggingCardMeta)}
                    isColumnDropTarget={
                      dropTargetColumnId === col.id || hoveredColumnId === col.id
                    }
                    onCardPointerStart={handleCardPointerStart}
                    onDragOverColumn={handleDragOverColumn}
                    onDropOnColumn={handleDropOnColumn}
                    onColumnDragStart={handleColumnDragStart}
                    onAddCard={handleAddCard}
                    onOpenCard={(card) => {
                      setSelectedCardId(null);
                      setEditingCard(card);
                    }}
                    onOpenCardQuickMenu={(card) => setQuickMenuCardId(card.id)}
                    onDeleteCard={handleDeleteCard}
                    onRenameColumn={handleRenameColumn}
                    onChangeColumnAccent={handleChangeColumnAccent}
                    onMoveColumn={handleMoveColumn}
                    onDeleteColumn={handleDeleteColumn}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setNewColumnOpen(true)}
                  className={`flex h-14 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-bold transition-transform hover:scale-[1.01] ${
                    layoutMode === 'mobile'
                      ? 'w-[78vw] max-w-[280px] snap-center'
                      : 'w-[280px]'
                  }`}
                  style={{
                    backgroundColor: 'var(--control-bg)',
                    borderColor: isPsy ? 'rgba(204, 255, 0, 0.55)' : 'var(--column-border)',
                    color: 'var(--text-on-canvas)',
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar columna</span>
                </button>
              </div>
            </LayoutGroup>
          </main>
        </div>
      )}

      {/* Floating Dragging Card Overlay */}
      {draggingCardMeta && activeOverlayCard && (
        <div
          ref={overlayRef}
          className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
          style={{
            width: `${draggingCardMeta.width}px`,
            transform: `translate3d(${draggingCardMeta.initialX}px, ${draggingCardMeta.initialY}px, 0) scale(1.03)`,
          }}
        >
          <KanbanCard
            card={activeOverlayCard}
            columnAccent={activeOverlayColumn?.accent ?? 'violet'}
            theme={theme}
            isOverlay
          />
        </div>
      )}

      {/* Mobile Thumb-Zone Bottom Action Bar for Selected Card */}
      {layoutMode === 'mobile' && activeView === 'board' && !hasAnyModalOpen && !draggingCardMeta && (
        <MobileCardActionBar
          card={selectedCard}
          columns={columns}
          cardIndexInColumn={selectedCardMetrics.index}
          totalInColumn={selectedCardMetrics.total}
          theme={theme}
          onMoveWithinColumn={moveCardWithinColumn}
          onMoveToColumn={moveCardToColumn}
          onClose={() => setSelectedCardId(null)}
        />
      )}

      {/* Notification / Undo Toast */}
      {toastState && (
        <div
          role="status"
          className={`fixed inset-x-3 z-50 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md ${
            layoutMode === 'mobile' && selectedCard && activeView === 'board' && !hasAnyModalOpen
              ? 'bottom-28 sm:bottom-5'
              : 'bottom-3 sm:bottom-5'
          }`}
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--card-text)',
            border: `var(--card-border-width) solid var(--card-border)`,
            boxShadow: isPsy ? '5px 5px 0px #00F5D4' : '0 16px 32px rgba(0,0,0,0.35)',
          }}
        >
          <span className="leading-snug">{toastState.message}</span>
          {((toastState.columns && toastState.cards) || toastState.deletedProject) && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold"
              style={{
                backgroundColor: 'var(--cta-bg)',
                color: 'var(--cta-text)',
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Deshacer</span>
            </button>
          )}
        </div>
      )}

      {/* Card Quick Action Sheet (zero-clipping) */}
      <CardQuickMenuSheet
        card={quickMenuCard}
        columns={columns}
        cardIndexInColumn={quickMenuCardMetrics.index}
        totalInColumn={quickMenuCardMetrics.total}
        theme={theme}
        onClose={() => setQuickMenuCardId(null)}
        onMoveWithinColumn={moveCardWithinColumn}
        onMoveToColumn={moveCardToColumn}
        onSelectForQuickBar={(cardId) => setSelectedCardId(cardId)}
        showQuickBarOption={layoutMode === 'mobile'}
        onEditCard={(card) => {
          setSelectedCardId(null);
          setEditingCard(card);
        }}
        onDeleteCard={handleDeleteCard}
      />

      {/* Modals */}
      <CardModal
        card={editingCard}
        columns={columns}
        theme={theme}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />

      <NewColumnModal
        open={newColumnOpen}
        theme={theme}
        onClose={() => setNewColumnOpen(false)}
        onCreateColumn={handleCreateColumn}
      />

      <ProjectsModal
        open={projectsModalOpen}
        startInCreateMode={projectsCreateMode}
        theme={theme}
        projects={projects}
        activeProjectId={activeProject.id}
        onClose={() => setProjectsModalOpen(false)}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      <TemplatesModal
        open={templatesOpen}
        theme={theme}
        onClose={() => setTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        theme={theme}
        onClose={() => setShortcutsOpen(false)}
      />

      <AiBreakdownModal
        open={aiModalOpen}
        theme={theme}
        columns={columns}
        defaultColumnId={defaultPendingColumnId}
        onClose={() => setAiModalOpen(false)}
        onTasksGenerated={handleAiTasksGenerated}
      />

      <AiCommandModal
        open={aiCommandModalOpen}
        theme={theme}
        projects={projects}
        activeProjectId={activeProject.id}
        columns={columns}
        cards={cards}
        canUndo={Boolean((toastState?.columns && toastState?.cards) || toastState?.deletedProject)}
        onUndo={handleUndo}
        onClose={() => setAiCommandModalOpen(false)}
        onExecuteActions={handleExecuteAiActions}
      />
    </div>
  );
}
