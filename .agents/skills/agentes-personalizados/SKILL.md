---
name: agentes-personalizados
description: >-
  Guía completa para diseñar, configurar, almacenar e invocar Agentes Personalizados (Custom Agents)
  en Google Antigravity (App 2.0 y CLI). Úsala cuando el usuario pida crear, editar, auditar o invocar
  agentes personalizados en `.agents/agents/`, configurar su frontmatter YAML (`tools`, `skills`,
  `mainAgent`, `subagent`, `commandExecutionPolicy`, `permissionMode`, `model`), o entender cómo
  funcionan como agente principal o subagente.
---

# Agentes Personalizados (Custom Agents en Antigravity)

Los **Agentes Personalizados** (*Custom Agents*) son configuraciones basadas en archivos Markdown (`.md`) con encabezado YAML frontmatter que definen un rol especializado con sus propias instrucciones de sistema, subconjunto de herramientas, skills acotadas, modelo y políticas de ejecución.

## 1. Por qué usar Agentes Personalizados (Filosofía y Optimización)

Los asistentes de propósito general sufren de falta de especialización y de **saturación de ventana de contexto (*context window bloat*)** al cargar prompts monolíticos, decenas de herramientas MCP y el catálogo completo de descripciones de skills en cada conversación.

Los agentes personalizados resuelven esto complementando a las *Skills* y a los *Subagentes dinámicos*:
- **Recorte quirúrgico de contexto (`skills` y `tools`):** Aunque las skills usan descubrimiento progresivo, tener decenas de skills globales consume tokens solo con sus descripciones y genera confusión de herramientas. Un agente personalizado declara únicamente las herramientas (`tools`), servidores MCP (`mcpServers`) y habilidades (`skills`) relevantes para su especialidad.
- **Aislamiento de contexto:** Cuando corre como subagente, inicia con una ventana de contexto limpia sin heredar el historial completo del agente padre.
- **Estandarización en equipo:** Al versionar los agentes en `.agents/agents/` dentro del repositorio, todo el equipo obtiene los mismos especialistas listos para usar sin configuración manual.

---

## 2. Dónde se Guardan (Rutas de Descubrimiento)

Antigravity descubre automáticamente los archivos de agentes personalizados en tres niveles:

| Ámbito | Ruta de Archivo | Uso Recomendado |
| :--- | :--- | :--- |
| **Proyecto / Workspace** | `.agents/agents/<nombre>.md`<br>o `.agents/agents/<nombre>/agent.md` | **Prioridad más alta.** Se versiona en Git para compartir especialistas del proyecto con todo el equipo. |
| **Global del Usuario** | `~/.gemini/config/agents/<nombre>.md`<br>o `~/.gemini/config/agents/<nombre>/agent.md` | Disponible en todos los proyectos de la máquina local del usuario. |
| **Plugin Empaquetado** | `plugins/<plugin_name>/agents/<nombre>.md` | Distribuido como parte de un plugin instalable. |

> Nota: Para agentes temporales que solo deben existir durante la conversación activa sin crear archivos en disco, se utiliza la herramienta `define_subagent`.

---

## 3. Formato del Archivo y Campos del Frontmatter YAML

Cada agente se define en un único archivo `.md` dividido en dos partes:
1. **Encabezado YAML Frontmatter (`---`):** Define metadatos, permisos, modelo y herramientas.
2. **Cuerpo Markdown:** Se compila directamente como el **System Prompt** del agente.

### Esquema Completo de Propiedades (YAML Frontmatter)

| Propiedad | Tipo | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | `string` | *(Obligatorio)* | Identificador único del agente (en minúsculas y separado por guiones, ej. `dependency-modernizer`). |
| `description` | `string` | *(Obligatorio)* | Descripción clara de su especialidad y cuándo el agente coordinador debe delegarle tareas. |
| `mainAgent` | `boolean` | `true` | **Simetría de ejecución:** Si es `true`, permite elegirlo directamente como agente principal de la sesión en la GUI o CLI. |
| `subagent` | `boolean` | `true` | **Simetría de ejecución:** Si es `true`, permite que un agente coordinador lo invoque como subagente mediante `invoke_subagent`. |
| `model` | `string` | `inherit` | Modelo asignado al agente: `inherit` (hereda el del padre/sesión), `flash`, `pro` o `flash_lite`. |
| `tools` | `string[]` | `[]` | Lista explícita de herramientas permitidas (ej. `view_file`, `write_to_file`, `replace_file_content`, `grep_search`, `find_by_name`, `list_dir`, `run_command`, `manage_task`). |
| `skills` | `string[]` | `[]` | Rutas de las skills que el agente puede utilizar (ej. `skills/package-upgrade-rules`, `skills/agentes-personalizados`). |
| `plugins` | `string[]` | `[]` | Dependencias de plugins habilitados para este agente. |
| `mcpServers` | `object[]` | `[]` | Servidores MCP específicos configurados para este agente. |
| `permissionMode` | `string` | *(Opcional)* | Nivel de permisos sobre ediciones/acciones (ej. `acceptEdits`, `bypassPermissions`). |
| `commandExecutionPolicy` | `string` | `sandbox` | Política de auto-ejecución de comandos de terminal: `off`, `auto`, `eager` o `sandbox`. Con `auto`, corre autónomamente comandos seguros de compilación/tests en segundo plano y exige aprobación manual solo para comandos destructivos o de alto riesgo. |

### Regla Crítica de Validación de `tools`

Verifica siempre la ortografía exacta de cada herramienta listada en `tools` (por ejemplo: `view_file`, `write_to_file`, `replace_file_content`, `grep_search`, `find_by_name`, `list_dir`, `run_command`, `manage_task`). Especificar un nombre de herramienta inexistente o mal escrito puede hacer que el proceso del subagente se quede colgado al iniciar.

---

## 4. Cómo se Invocan y Gestionan

Gracias a la **simetría de ejecución** (`mainAgent: true` y `subagent: true`), un mismo archivo `.md` puede ejecutarse de dos formas:

### A. Como Agente Principal (`mainAgent: true`)
Hablas directamente con el agente personalizado desde el inicio de la sesión adoptando su System Prompt y restricciones del frontmatter:
1. **En Antigravity 2.0 (Desktop App GUI):** Selecciónalo directamente desde el menú desplegable (dropdown) de agentes en la interfaz de chat.
2. **En Antigravity CLI (`agy`):**
   - Al arrancar por línea de comandos:
     ```bash
     agy --agent <nombre-del-agente>
     ```
   - Dentro de una sesión interactiva: ejecuta el comando `/agents` para abrir el panel *Agent Manager* y cambiar de agente principal.

### B. Como Subagente en Segundo Plano (`subagent: true`)
Un agente coordinador delega trabajo asíncrono sin contaminar su propio contexto:
1. **Invocación por herramienta (`invoke_subagent`):**
   El agente padre llama a `invoke_subagent` pasando:
   - `TypeName`: El `name` definido en el frontmatter del agente (ej. `auditor-practicas`).
   - `Role`: Título descriptivo de la misión actual (2 a 5 palabras).
   - `Prompt`: Tarea accionable y criterio de finalización.
   - `Model`: `inherit` (por defecto), `flash`, `pro` o `flash_lite`.
   - `Workspace`:
     - `inherit` (por defecto): comparte el mismo directorio de trabajo del padre.
     - `branch`: crea un Git worktree aislado para editar/compilar sin colisiones.
     - `share`: comparte almacenamiento del repositorio permitiendo ramas independientes.
2. **Ciclo de Vida del Subagente:**
   - `Running`: Ejecutando herramientas activamente. Se puede detener desde el panel de subagentes o con la tecla `k` en `/agents` (CLI).
   - `Idle`: Terminó su tarea, envió su reporte al padre y quedó en pausa (consume cero tokens). Si recibe un nuevo mensaje (`send_message` con su `conversationId` o mención `@`), **despierta automáticamente** conservando todo su contexto previo.
   - `Killed`: Terminado permanentemente (`manage_subagents` con `kill` / `kill_all`); limpia cualquier Git worktree temporal pero conserva el log JSONL.
3. **Interacción Directa del Usuario y Atajos en CLI:**
   - **Mención directa:** Escribe `@<nombre-subagente> <instrucción>` en el chat o abre su conversación en el panel de subagentes para darle órdenes sin pasar por el agente padre.
   - **Inspección profunda (`/agents`):** Usa `↑/↓` y `Enter` para ver pensamientos internos, llamadas a herramientas y logs en tiempo real (`Esc` para salir).
   - **Aprobación rápida de permisos en CLI:**
     - `Alt + J`: Teletransporta la vista directamente al detalle del siguiente subagente que está esperando aprobación manual.
     - `Ctrl + K`: Aprueba al instante (*fast-path*) la acción pendiente mostrada en la barra de estado sin cambiar de panel.

---

## 5. Plantilla de Referencia Lista para Usar

```markdown
---
name: dependency-modernizer
description: "Actualiza paquetes locales, ejecuta la suite de pruebas y verifica que el build compile sin errores. Úsalo al modernizar dependencias o resolver conflictos de versiones."
model: flash
mainAgent: true
subagent: true
permissionMode: acceptEdits
commandExecutionPolicy: auto
tools:
  - view_file
  - replace_file_content
  - manage_task
  - run_command
skills:
  - skills/package-upgrade-rules
---

# Instrucciones Principales

Eres un especialista en modernización de dependencias. Tu trabajo consiste en inspeccionar archivos de configuración, actualizar los paquetes objetivo, ejecutar la suite de tests y verificar que el build pase limpiamente.

## Reglas de Ejecución
1. Revisa siempre cambios rompientes (breaking changes) antes de subir versiones mayores.
2. Ejecuta `npm run lint` y `npm run build` tras cada actualización.
3. Si una actualización rompe el build, revierte o corrige la incompatibilidad antes de reportar.
```

---

## 6. Procedimiento para Crear o Auditar un Agente en este Proyecto

1. **Ubicación:** Crea o edita el archivo en `.agents/agents/<nombre-en-kebab-case>.md`.
2. **Verifica el principio de mínimo privilegio:**
   - Si el agente es de solo lectura/auditoría (como `auditor-practicas`), incluye únicamente `view_file`, `grep_search`, `find_by_name`, `list_dir`, `run_command` (sin `write_to_file` ni `replace_file_content`).
   - Si el agente modifica código (como `arquitecto-estado-datos`, `especialista-ui-ux`, `ingeniero-ia-flujos`), habilita `write_to_file` y `replace_file_content` y acota en su System Prompt qué rutas del proyecto tiene permitido tocar.
3. **Sincronización con `AGENTS.md`:** Si agregas un nuevo agente permanente al escuadrón del proyecto, regístralo en la sección de agentes especializados de `AGENTS.md` en la raíz del repositorio.
