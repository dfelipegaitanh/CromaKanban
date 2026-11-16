export type ThemeMode = 'dark' | 'light';

export type LayoutMode = 'desktop' | 'mobile';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type ColumnAccentId =
  | 'acid'
  | 'magenta'
  | 'cyan'
  | 'tangerine'
  | 'violet'
  | 'emerald';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface KanbanCardItem {
  id: string;
  columnId: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  dueDate: string;
  checklist: ChecklistItem[];
  createdAt: number;
}

export interface KanbanColumnItem {
  id: string;
  title: string;
  accent: ColumnAccentId;
}

export interface KanbanProject {
  id: string;
  name: string;
  accent: ColumnAccentId;
  columns: KanbanColumnItem[];
  cards: KanbanCardItem[];
  createdAt: number;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  columns: KanbanColumnItem[];
  cards: KanbanCardItem[];
}

export type ActiveView = 'board' | 'summary';

export interface ColumnAccentTokens {
  id: ColumnAccentId;
  label: string;
  standardHex: string;
}

export const COLUMN_ACCENTS: Record<ColumnAccentId, ColumnAccentTokens> = {
  acid: {
    id: 'acid',
    label: 'Lima ácida',
    standardHex: '#16A34A',
  },
  magenta: {
    id: 'magenta',
    label: 'Magenta solar',
    standardHex: '#E11D48',
  },
  cyan: {
    id: 'cyan',
    label: 'Cian eléctrico',
    standardHex: '#0284C7',
  },
  tangerine: {
    id: 'tangerine',
    label: 'Mandarina',
    standardHex: '#D97706',
  },
  violet: {
    id: 'violet',
    label: 'Ultravioleta',
    standardHex: '#7C3AED',
  },
  emerald: {
    id: 'emerald',
    label: 'Menta cósmica',
    standardHex: '#059669',
  },
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: 'Prioridad alta',
  medium: 'Prioridad media',
  low: 'Prioridad baja',
};
