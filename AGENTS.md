# Reglas Globales de Arquitectura y Orquestación de Agentes (Local-First)

Este proyecto es una aplicación **local-first**. No se requiere burocracia de seguridad cloud (ni autenticación, ni RBAC, ni CORS empresarial), pero **la integridad de rutas, el desacoplamiento por capas y la exactitud de las actualizaciones de estado son innegociables**.

---

## 1. Disciplina Estricta de Rutas (Archivos, Endpoints y Estado)

- **Rutas del Sistema de Archivos:**
  - `src/types/` → Contratos e interfaces TypeScript compartidas (Fuente Única de Verdad del modelo de dominio).
  - `src/data/` → Semillas iniciales, plantillas y constantes estáticas del dominio.
  - `src/hooks/` (y `src/services/`) → Lógica de estado, sincronización local, gestos e integración con API.
  - `src/components/` → Componentes visuales desacoplados de la persistencia en disco.
  - `src/index.css` → Tokens semánticos CSS para todos los temas visuales (`dark`, `light`).
  - `server.ts` → Servidor Express local, persistencia atómica en `./data/` y rutas `/api/board` y `/api/ai/*`.
  - **Regla de Oro al Refactorizar o Mover Código:** Cuando una función, componente o tipo cambie de ruta, se actualizan todas sus importaciones y se elimina el código de la ruta antigua en el mismo paso. Prohibido dejar código duplicado o archivos huérfanos.

- **Rutas de Actualización de Datos:**
  - Toda mutación (manual desde la UI, por API o disparada por IA) debe actualizar **única y exclusivamente** el proyecto (`activeProjectId`), la columna/vista y la entidad objetivo.
  - Prohibido causar efectos colaterales en otros proyectos, pisar propiedades no relacionadas o escribir en endpoints/archivos distintos a los destinados para esa operación.

---

## 2. Escuadrón de Agentes Especializados (`.agents/agents/`)

**Punto de entrada recomendado:** selecciona **`orquestador`** ([orquestador.md](.agents/agents/orquestador.md)) como agente principal (dropdown en Antigravity 2.0 o `agy --agent orquestador`). No edita código: mide el impacto, reparte por capa entre los especialistas y cierra siempre con `auditor-practicas`.

Si trabajas con el agente por defecto, aplica la misma regla: toda tarea de desarrollo que toque más de una capa se delega a los especialistas y se verifica con el auditor antes de darla por terminada.

Los 4 especialistas permanentes del proyecto:

1. **`auditor-practicas`** ([auditor-practicas.md](.agents/agents/auditor-practicas.md)):
   - Guardián de arquitectura, disciplina de rutas, separación de responsabilidades (SRP), Fuente Única de Verdad (SSOT) e higiene de ejecución (`npm run lint` + `npm run build`).
2. **`arquitecto-estado-datos`** ([arquitecto-estado-datos.md](.agents/agents/arquitecto-estado-datos.md)):
   - Dueño de modelos de dominio, estado en cliente, sincronización `localStorage` ↔ `./data/` y rutas de datos en el servidor local.
3. **`especialista-ui-ux`** ([especialista-ui-ux.md](.agents/agents/especialista-ui-ux.md)):
   - Dueño de vistas, componentes, tokens multi-tema, animaciones a 60fps (`requestAnimationFrame` / `motion`) y ergonomía Desktop/Mobile.
4. **`ingeniero-ia-flujos`** ([ingeniero-ia-flujos.md](.agents/agents/ingeniero-ia-flujos.md)):
   - Dueño del copiloto multimodal (voz, texto, `FunctionDeclaration`, esquemas estructurados y reversibilidad Undo de acciones de IA).
