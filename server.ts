import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { FunctionDeclaration, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'cromakanban-db.json');

interface PersistedBoardPayload {
  projects: unknown[];
  activeProjectId: string;
  theme: 'dark' | 'light';
  updatedAt: string;
}

let writeQueue: Promise<void> = Promise.resolve();

async function readBoardDb(): Promise<PersistedBoardPayload | null> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedBoardPayload>;
    if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
      const theme =
        parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : 'dark';
      return {
        projects: parsed.projects,
        activeProjectId: typeof parsed.activeProjectId === 'string' ? parsed.activeProjectId : '',
        theme,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') return null;
    console.error('Error leyendo la BD local:', err);
    return null;
  }
}

function writeBoardDb(payload: PersistedBoardPayload): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DB_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(payload, null, 2), 'utf8');
    await fs.rename(tmpFile, DB_FILE);
  });
  return writeQueue;
}

interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  checklist: string[];
}

interface BoardSnapshotColumn {
  id: string;
  title: string;
  accent: string;
}

interface BoardSnapshotCard {
  id: string;
  columnId: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  checklistCount: number;
  checklistDoneCount: number;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Falta configurar GEMINI_API_KEY en las variables de entorno del servidor.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const KANBAN_TOOLS: FunctionDeclaration[] = [
  {
    name: 'deleteCards',
    description:
      'Elimina una o más tarjetas existentes del tablero que coincidan con lo pedido por el usuario.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cardIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'IDs exactos de las tarjetas a eliminar.',
        },
        reason: {
          type: Type.STRING,
          description: 'Explicación breve en español de qué tarjetas se eliminaron y por qué.',
        },
      },
      required: ['cardIds', 'reason'],
    },
  },
  {
    name: 'moveCards',
    description: 'Mueve una o más tarjetas existentes a otra columna del tablero.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cardIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'IDs exactos de las tarjetas a mover.',
        },
        targetColumnId: {
          type: Type.STRING,
          description: 'ID exacto de la columna destino.',
        },
        reason: {
          type: Type.STRING,
          description: 'Explicación breve en español del movimiento realizado.',
        },
      },
      required: ['cardIds', 'targetColumnId', 'reason'],
    },
  },
  {
    name: 'updateCards',
    description:
      'Actualiza propiedades (título, descripción, categoría, prioridad o fecha límite) de tarjetas existentes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        updates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cardId: { type: Type.STRING, description: 'ID exacto de la tarjeta.' },
              title: { type: Type.STRING, description: 'Nuevo título opcional.' },
              description: { type: Type.STRING, description: 'Nueva descripción opcional.' },
              category: { type: Type.STRING, description: 'Nueva categoría opcional.' },
              priority: {
                type: Type.STRING,
                enum: ['high', 'medium', 'low'],
                description: 'Nueva prioridad opcional.',
              },
              dueDate: {
                type: Type.STRING,
                description: 'Nueva fecha límite en formato YYYY-MM-DD (o vacío para quitarla).',
              },
            },
            required: ['cardId'],
          },
        },
        reason: {
          type: Type.STRING,
          description: 'Explicación breve en español de los cambios aplicados.',
        },
      },
      required: ['updates', 'reason'],
    },
  },
  {
    name: 'createCards',
    description:
      'Crea una o varias tarjetas nuevas (desglosando una idea o agregando tareas sueltas) dentro de una columna del tablero.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnId: {
          type: Type.STRING,
          description:
            'ID exacto de la columna donde crear las tarjetas (por defecto la columna de pendientes/backlog/ideas si el usuario no especifica otra).',
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Título corto y accionable de la tarea en español.',
              },
              description: {
                type: Type.STRING,
                description: 'Descripción breve y práctica de la tarea.',
              },
              category: {
                type: Type.STRING,
                description: 'Etiqueta corta de 1 o 2 palabras.',
              },
              priority: {
                type: Type.STRING,
                enum: ['high', 'medium', 'low'],
              },
              checklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista opcional de 0 a 4 subtareas.',
              },
            },
            required: ['title', 'description', 'category', 'priority', 'checklist'],
          },
        },
        reason: {
          type: Type.STRING,
          description: 'Explicación breve en español de las tarjetas creadas.',
        },
      },
      required: ['columnId', 'tasks', 'reason'],
    },
  },
  {
    name: 'createColumn',
    description: 'Crea una nueva columna en el tablero Kanban.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Nombre de la nueva columna.' },
        accent: {
          type: Type.STRING,
          enum: ['acid', 'magenta', 'cyan', 'tangerine', 'violet', 'emerald'],
          description: 'Color de acento de la columna.',
        },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['title', 'accent', 'reason'],
    },
  },
  {
    name: 'renameColumn',
    description: 'Cambia el nombre de una columna existente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnId: { type: Type.STRING, description: 'ID exacto de la columna.' },
        newTitle: { type: Type.STRING, description: 'Nuevo nombre para la columna.' },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['columnId', 'newTitle', 'reason'],
    },
  },
  {
    name: 'deleteColumn',
    description: 'Elimina una columna existente y sus tarjetas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        columnId: { type: Type.STRING, description: 'ID exacto de la columna a eliminar.' },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['columnId', 'reason'],
    },
  },
  {
    name: 'setTheme',
    description: 'Cambia el tema visual del tablero entre oscuro o claro.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        theme: {
          type: Type.STRING,
          enum: ['dark', 'light'],
          description: 'Tema visual destino.',
        },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['theme', 'reason'],
    },
  },
  {
    name: 'createProject',
    description: 'Crea un nuevo proyecto con su propio tablero Kanban independiente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Nombre del nuevo proyecto.' },
        accent: {
          type: Type.STRING,
          enum: ['acid', 'magenta', 'cyan', 'tangerine', 'violet', 'emerald'],
          description: 'Color de acento del proyecto.',
        },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['name', 'accent', 'reason'],
    },
  },
  {
    name: 'switchProject',
    description: 'Cambia el tablero activo a otro proyecto existente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING, description: 'ID exacto del proyecto destino.' },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['projectId', 'reason'],
    },
  },
  {
    name: 'deleteProject',
    description:
      'Elimina un proyecto existente ÚNICAMENTE si está completamente vacío (cardCount === 0) y existe más de un proyecto. Si el proyecto tiene una o más tarjetas, NO lo borres e informa al usuario que debe vaciar sus tarjetas primero.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING, description: 'ID exacto del proyecto a eliminar.' },
        reason: { type: Type.STRING, description: 'Resumen breve en español.' },
      },
      required: ['projectId', 'reason'],
    },
  },
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/board', async (_req, res) => {
    try {
      const db = await readBoardDb();
      if (!db) {
        res.json({ initialized: false });
        return;
      }
      res.json({
        initialized: true,
        projects: db.projects,
        activeProjectId: db.activeProjectId,
        theme: db.theme,
        updatedAt: db.updatedAt,
      });
    } catch (err) {
      console.error('Error en GET /api/board:', err);
      res.status(500).json({ error: 'No se pudo leer la base de datos local.' });
    }
  });

  app.put('/api/board', async (req, res) => {
    try {
      const body = req.body as Partial<PersistedBoardPayload>;
      if (!Array.isArray(body?.projects) || body.projects.length === 0) {
        res.status(400).json({ error: 'El arreglo de proyectos es obligatorio.' });
        return;
      }

      const theme =
        body.theme === 'dark' || body.theme === 'light' ? body.theme : 'dark';

      const payload: PersistedBoardPayload = {
        projects: body.projects,
        activeProjectId:
          typeof body.activeProjectId === 'string' ? body.activeProjectId : '',
        theme,
        updatedAt: new Date().toISOString(),
      };

      await writeBoardDb(payload);
      res.json({ ok: true, updatedAt: payload.updatedAt });
    } catch (err) {
      console.error('Error en PUT /api/board:', err);
      res.status(500).json({ error: 'No se pudo guardar en la base de datos local.' });
    }
  });

  app.post('/api/ai/transcribe', async (req, res) => {
    try {
      const body = req.body as { audioBase64?: unknown; mimeType?: unknown };
      const audioBase64 = typeof body?.audioBase64 === 'string' ? body.audioBase64.trim() : '';
      const mimeType =
        typeof body?.mimeType === 'string' && body.mimeType.trim()
          ? body.mimeType.trim().split(';')[0]
          : 'audio/webm';

      if (!audioBase64) {
        res.status(400).json({ error: 'No se recibió audio para transcribir.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe exactamente lo que dice la persona en español. Devuelve únicamente la transcripción limpia sin comillas ni notas adicionales.',
            },
          ],
        },
      });

      const transcript = (response.text ?? '').trim();
      res.json({ text: transcript });
    } catch (err) {
      console.error('Error en /api/ai/transcribe:', err);
      const message =
        err instanceof Error ? err.message : 'No se pudo transcribir el audio.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/command', async (req, res) => {
    try {
      const body = req.body as {
        command?: unknown;
        theme?: unknown;
        board?: {
          activeProjectId?: string;
          projects?: Array<{ id: string; name: string; cardCount?: number }>;
          columns?: BoardSnapshotColumn[];
          cards?: BoardSnapshotCard[];
        };
      };

      const command = typeof body?.command === 'string' ? body.command.trim() : '';
      if (!command) {
        res.status(400).json({ error: 'Escribe o dicta una instrucción para el tablero.' });
        return;
      }

      const columns = Array.isArray(body?.board?.columns) ? body.board.columns : [];
      const cards = Array.isArray(body?.board?.cards) ? body.board.cards : [];
      const projects = Array.isArray(body?.board?.projects) ? body.board.projects : [];
      const activeProjectId =
        typeof body?.board?.activeProjectId === 'string' ? body.board.activeProjectId : '';
      const currentTheme =
        body?.theme === 'dark' || body?.theme === 'light' ? body.theme : 'dark';

      const ai = getGeminiClient();

      const boardContext = JSON.stringify(
        {
          today: new Date().toISOString().slice(0, 10),
          currentTheme,
          activeProjectId,
          projects,
          columns,
          cards,
        },
        null,
        2
      );

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Estado actual del tablero Kanban:\n${boardContext}\n\nInstrucción del usuario:\n"${command}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres el asistente inteligente integrado en CromaKanban. ' +
            'El usuario te da instrucciones en lenguaje natural (por texto o voz) para interactuar con sus tarjetas y columnas: ' +
            'puede pedirte borrar tarjetas que cumplan una condición semántica, moverlas de columna, editar sus datos o prioridades, crear nuevas tarjetas o desglosar un proyecto en pendientes, crear/renombrar/borrar columnas, crear/cambiar/eliminar proyectos o cambiar de tema visual. ' +
            'Regla estricta de proyectos: NUNCA llames a deleteProject si el proyecto tiene cardCount > 0 o si es el único proyecto; en ese caso explícale al usuario que primero debe vaciar o mover las tarjetas del proyecto. ' +
            'Analiza semánticamente el título, descripción, categoría, prioridad y columna de cada tarjeta en el estado del tablero. ' +
            'Usa EXCLUSIVAMENTE los IDs exactos que aparecen en el estado actual del tablero. ' +
            'Cuando el usuario pida crear o desglosar tareas sin decir columna, envíalas a la columna de pendientes/por hacer/backlog/ideas (la primera columna inicial). ' +
            'Si ninguna tarjeta coincide con lo que pide el usuario o la instrucción es solo una pregunta informativa, NO inventes llamadas a herramientas y respóndele claramente en español.',
          tools: [{ functionDeclarations: KANBAN_TOOLS }],
        },
      });

      const functionCalls = response.functionCalls ?? [];
      const actions = functionCalls.map((fc) => ({
        name: fc.name ?? '',
        args: (fc.args ?? {}) as Record<string, unknown>,
      }));

      const reasons = actions
        .map((a) => (typeof a.args.reason === 'string' ? a.args.reason.trim() : ''))
        .filter(Boolean);

      const replyText =
        (response.text ?? '').trim() ||
        (reasons.length > 0
          ? reasons.join(' ')
          : 'Listo, ejecuté los cambios en el tablero.');

      res.json({
        reply: replyText,
        actions,
      });
    } catch (err) {
      console.error('Error en /api/ai/command:', err);
      const message =
        err instanceof Error ? err.message : 'No se pudo procesar tu instrucción.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/breakdown', async (req, res) => {
    try {
      const body = req.body as { goal?: unknown; targetColumnTitle?: unknown };
      const goal = typeof body?.goal === 'string' ? body.goal.trim() : '';
      const targetColumnTitle =
        typeof body?.targetColumnTitle === 'string' && body.targetColumnTitle.trim()
          ? body.targetColumnTitle.trim()
          : 'Pendientes';

      if (!goal) {
        res.status(400).json({ error: 'Escribe una idea o descripción para desglosar.' });
        return;
      }

      if (goal.length > 3000) {
        res
          .status(400)
          .json({ error: 'El texto es demasiado largo. Resúmelo a menos de 3000 caracteres.' });
        return;
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Objetivo o lista del usuario:\n"""\n${goal}\n"""\n\nDesglosa esto en tareas accionables para agregarlas a la columna "${targetColumnTitle}" del tablero Kanban.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres un asistente experto en productividad y gestión ágil de proyectos. ' +
            'Tu trabajo es tomar cualquier texto libre del usuario (una meta grande, notas desordenadas, un proyecto, una lista rápida o una idea) y desglosarlo en entre 2 y 7 tarjetas Kanban concretas, claras y accionables en español. ' +
            'Cada tarjeta debe tener: un título breve empezando por un verbo de acción (máx 65 caracteres), una descripción útil de 1-2 frases, una categoría corta de 1-2 palabras, una prioridad ("high", "medium" o "low") y de 0 a 4 subtareas concretas en checklist.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Título corto y accionable de la tarea en español.',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'Descripción breve y práctica de qué hacer en esta tarea.',
                    },
                    category: {
                      type: Type.STRING,
                      description: 'Etiqueta corta de 1 o 2 palabras, ej. Diseño, Backend, Compras.',
                    },
                    priority: {
                      type: Type.STRING,
                      enum: ['high', 'medium', 'low'],
                      description: 'Prioridad estimada de la tarea.',
                    },
                    checklist: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Lista opcional de 0 a 4 subtareas concretas.',
                    },
                  },
                  required: ['title', 'description', 'category', 'priority', 'checklist'],
                },
              },
            },
            required: ['tasks'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      const parsed = JSON.parse(rawText || '{"tasks":[]}') as { tasks?: unknown };

      if (!Array.isArray(parsed.tasks)) {
        res.status(502).json({ error: 'La IA no devolvió un formato de tareas válido.' });
        return;
      }

      const sanitizedTasks: GeneratedTask[] = parsed.tasks
        .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
        .map((t) => {
          const rawPriority = String(t.priority ?? 'medium');
          const priority: 'high' | 'medium' | 'low' =
            rawPriority === 'high' || rawPriority === 'low' ? rawPriority : 'medium';

          const checklist = Array.isArray(t.checklist)
            ? t.checklist
                .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                .map((s) => s.trim())
                .slice(0, 5)
            : [];

          return {
            title: String(t.title ?? '').trim() || 'Nueva tarea',
            description: String(t.description ?? '').trim(),
            category: String(t.category ?? '').trim() || 'General',
            priority,
            checklist,
          };
        })
        .slice(0, 10);

      res.json({ tasks: sanitizedTasks });
    } catch (err) {
      console.error('Error en /api/ai/breakdown:', err);
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error al generar las tareas.';
      res.status(500).json({ error: message });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CromaKanban server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
