# CromaKanban

Tablero Kanban multiproyecto interactivo con estética personalizable (**Psicodélico**, **Oscuro** y **Claro**), asistencia inteligente con **Gemini** por texto y voz, persistencia en base de datos JSON local en el servidor y experiencia adaptable entre **modo ordenador** (por defecto) y **modo móvil**.

---

## Finalidad del proyecto

**CromaKanban** está diseñado para organizar ideas, tareas y proyectos de forma visual y rápida sin depender de servicios externos ni bases de datos complejas:

- Centralizar múltiples tableros independientes por proyecto en un mismo espacio de trabajo.
- Manipular tarjetas y columnas de manera ágil tanto con ratón/teclado (drag & drop a 60fps, atajos y paneo horizontal) como mediante comandos en lenguaje natural o dictado por voz.
- Conservar todos los proyectos, columnas, tarjetas y preferencias visuales localmente en el archivo `./data/cromakanban-db.json` del servidor.

---

## Funcionalidades principales

- **Multiproyecto**: Crea, renombra, alterna y elimina proyectos independientes, partiendo desde tablero en blanco o plantillas predefinidas (*Estudio Creativo & Festival*, *Sprint de Producto Software*, etc.).
- **Tablero Kanban completo**:
  - Columnas con título editable en línea, paleta de 6 colores de acento y reordenamiento horizontal.
  - Tarjetas con título, descripción, etiqueta de categoría, prioridad (`alta`, `media`, `baja`), fecha límite y checklist interactivo de subtareas.
  - Arrastre fluido de tarjetas entre columnas y dentro de la misma columna, además de paneo horizontal y barra de navegación rápida entre columnas.
- **Triple tema visual**:
  - **Psicodélico** (alto contraste, acentos neón y fondo animado).
  - **Oscuro** (superficies sobrias en slate oscuro).
  - **Claro** (estética limpia y luminosa).
- **Vista Resumen**: Panel analítico con métricas de progreso general, distribución por columna, prioridades y checklist completado.
- **Búsqueda y filtros**: Búsqueda instantánea por título/descripción/categoría y filtro por prioridad.
- **Asistente de IA integrado (texto y voz)**:
  - **Desglosar con IA (`I`)**: Convierte una meta o lista libre en entre 2 y 7 tarjetas accionables con subtareas.
  - **Voz / Comandos (`K`)**: Interpreta instrucciones naturales por texto o micrófono para crear, mover, actualizar o borrar tarjetas y columnas, cambiar de tema o gestionar proyectos.
- **Deshacer acciones**: Notificaciones toast con botón **Deshacer** tras eliminar tarjetas, columnas, proyectos o ejecutar acciones de IA.
- **Atajos de teclado**:
  - `1`, `2`, `3`: Cambiar entre tema Psicodélico, Oscuro y Claro.
  - `I`: Abrir *Desglosar con IA*.
  - `K`: Abrir *Voz / Comandos con IA*.
  - `N`: Crear nueva columna.
  - `/`: Enfocar el buscador.

---

## Historial de cambios y actualizaciones implementadas

### 1. Arquitectura Full-Stack y seguridad de API Key (`server.ts`)
- Servidor **Express** integrado con **Vite** en desarrollo (`tsx server.ts`) y archivos estáticos en producción (`npm run build` + `npm start`).
- Las llamadas a Gemini mediante `@google/genai` se ejecutan exclusivamente en el backend usando la variable de entorno `GEMINI_API_KEY`, evitando exponer credenciales en el navegador.

### 2. Interacción por texto y voz en lenguaje natural con IA
- Endpoint `POST /api/ai/command` con `gemini-4-hydrogen` y *function calling* (`KANBAN_TOOLS`) para ejecutar acciones semánticas sobre el estado actual del tablero:
  - `deleteCards`, `moveCards`, `updateCards`, `createCards`
  - `createColumn`, `renameColumn`, `deleteColumn`
  - `createProject`, `switchProject`, `setTheme`
- Endpoint `POST /api/ai/transcribe` con `gemini-3.5-transcribe` para transcribir grabaciones de voz en español desde `AiCommandModal`.
- Endpoint `POST /api/ai/breakdown` para desglosar objetivos en tarjetas estructuradas.
- Corrección de flujo al aplicar comandos: al confirmar la ejecución, el modal se cierra automáticamente y muestra un toast con el resumen de cambios y opción de **Deshacer**.

### 3. Soporte multiproyecto
- Estructura `KanbanProject` en `src/types/kanban.ts` con columnas, tarjetas y acento propios por proyecto.
- Componente `ProjectsModal` para crear nuevos proyectos (eligiendo color y plantilla base), cambiar de proyecto, renombrar o eliminar con soporte de deshacer.
- Selector desplegable de proyectos integrado en `WorkspaceToolbar` y manejable también mediante comandos de IA.

### 4. Base de datos persistente en archivo JSON local
- Endpoints `GET /api/board` y `PUT /api/board` en `server.ts` que leen y escriben de forma atómica (archivo temporal + `rename` en cola secuencial) en `./data/cromakanban-db.json`.
- Hidratación automática al cargar la aplicación, sincronización con debounce de `300 ms`, respaldo en `localStorage` y guardado `keepalive` en `beforeunload` al cerrar o recargar la pestaña.

### 5. Optimización móvil y sistema híbrido para mover tarjetas
- Mejoras generales de adaptabilidad en `index.html`, `src/index.css` y modales (`max-h-[92dvh]`, entradas `16px` en móvil para evitar zoom automático en iOS).
- **Menú rápido en cada tarjeta (`⋮` / `CardQuickMenuSheet`)**: Renderizado en la raíz para evitar recortes dentro del scroll de columnas; permite **Subir / Bajar** la posición en la columna, mover a **Anterior / Siguiente** o elegir cualquier columna destino, **Editar**, **Eliminar** y fijar en la barra inferior en modo móvil.
- **Barra inferior fija en zona del pulgar (`MobileCardActionBar`)**: Permite mover y reordenar rápidamente la tarjeta seleccionada con botones grandes (`↑`, `↓`, `←`, `→` y selector directo de columna), desplazando el tablero automáticamente al cambiar de columna.
- **Arrastre táctil mejorado**:
  - Toque largo de `280 ms` sobre cualquier tarjeta (con tolerancia de `8 px` para no interferir con el scroll normal y vibración háptica si el dispositivo la soporta).
  - Arrastre inmediato desde el icono de agarre (`⋮⋮`).
  - Suspensión temporal del scroll vertical de columnas y `scroll-snap` horizontal durante el arrastre para cruzar entre columnas sin bloqueos.

### 6. Modo ordenador por defecto con selector rápido
- Se incorporó `LayoutMode` (`'desktop' | 'mobile'`) con valor inicial **`desktop` (Modo ordenador)** guardado en `localStorage`.
- Por defecto se muestran siempre la cabecera completa (`Tablero`, `Proyectos`, `Resumen`, `Plantillas`, `Atajos`), la barra de herramientas completa, columnas de `328 px` y las flechas de navegación lateral, incluso en ventanas estrechas o paneles de vista previa reducidos.
- Se añadió un botón en `Header` para alternar en un clic entre **Móvil** y **Ordenador**.

---

## Estructura del proyecto

```text
├── server.ts                          # Servidor Express, rutas /api/board y /api/ai/*
├── index.html                         # Entrada HTML y metadatos
├── package.json                       # Scripts y dependencias
├── .env.example                       # Plantilla de variables de entorno
└── src/
    ├── App.tsx                        # Estado global, proyectos, drag & drop y sincronización DB
    ├── index.css                      # Variables de los 3 temas y utilidades Tailwind
    ├── types/kanban.ts                # Tipos TypeScript (proyectos, tarjetas, columnas, temas, layout)
    ├── data/initialBoard.ts           # Tablero inicial y plantillas predefinidas
    └── components/
        ├── Header.tsx                 # Cabecera adaptable y selector Ordenador/Móvil
        ├── WorkspaceToolbar.tsx       # Selector de proyecto, buscador, filtros, temas e IA
        ├── KanbanColumn.tsx           # Columna, menú de columna y creación rápida de tarjetas
        ├── KanbanCard.tsx             # Tarjeta interactiva con agarre y acceso a menú rápido
        ├── CardQuickMenuSheet.tsx     # Hoja de acciones rápidas (mover, reordenar, editar, borrar)
        ├── MobileCardActionBar.tsx    # Barra inferior fija para mover tarjeta en modo móvil
        ├── CardModal.tsx              # Editor completo de tarjeta y checklist
        ├── ProjectsModal.tsx          # Administrador y creador de proyectos
        ├── AiBreakdownModal.tsx       # Generador de tareas desde texto con IA
        ├── AiCommandModal.tsx         # Consola de comandos por texto y voz con IA
        ├── NewColumnModal.tsx         # Modal para crear columna
        ├── TemplatesModal.tsx         # Selector de plantillas de tablero
        ├── ShortcutsModal.tsx         # Guía de atajos de teclado
        ├── SummaryView.tsx            # Vista de métricas y resumen del proyecto
        └── PsychedelicBackdrop.tsx    # Fondo animado para el tema psicodélico
```

---

## Ejecución en local (por ejemplo, desde Antigravity)

### Requisitos
- **Node.js 20+** y **npm**

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```env
GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
```

> Sin `GEMINI_API_KEY`, el tablero Kanban y la base de datos local funcionan con normalidad, pero las rutas de IA (`/api/ai/*`) devolverán un aviso indicando que falta la clave.

### 3. Iniciar en modo desarrollo
```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`. Al realizar el primer cambio, el servidor creará automáticamente `./data/cromakanban-db.json` (excluido de Git mediante `.gitignore`).

### 4. Compilar y ejecutar en producción
```bash
npm run build
npm start
```

### 5. Verificar tipos TypeScript
```bash
npm run lint
```
