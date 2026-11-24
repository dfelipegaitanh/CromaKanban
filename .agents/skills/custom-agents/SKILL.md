---
name: custom-agents
description: >-
  Complete guide to designing, configuring, storing, and invoking Custom Agents in Google Antigravity
  (App 2.0 and CLI). Use when the user asks to create, edit, audit, or invoke custom agents in
  `.agents/agents/`, configure their YAML frontmatter (`tools`, `skills`, `mainAgent`, `subagent`,
  `commandExecutionPolicy`, `permissionMode`, `model`), or understand how they work as a main agent
  or subagent.
---

# Custom Agents (in Antigravity)

**Custom Agents** are Markdown-based (`.md`) configurations with a YAML frontmatter header that define a specialized role with its own system instructions, subset of tools, scoped skills, model, and execution policies.

## 1. Why Use Custom Agents (Philosophy and Optimization)

General-purpose assistants suffer from a lack of specialization and **context window bloat** when loading monolithic prompts, dozens of MCP tools, and the entire catalog of skill descriptions in every conversation.

Custom agents solve this by complementing *Skills* and *dynamic Subagents*:
- **Surgical context trimming (`skills` and `tools`):** Even though skills use progressive discovery, having dozens of global skills consumes tokens just with their descriptions and causes tool confusion. A custom agent declares only the tools (`tools`), MCP servers (`mcpServers`), and skills (`skills`) relevant to its specialty.
- **Context isolation:** When running as a subagent, it starts with a clean context window without inheriting the parent agent's full history.
- **Team standardization:** By versioning agents in `.agents/agents/` inside the repository, the entire team gets the same ready-to-use specialists without manual configuration.

---

## 2. Where They Are Stored (Discovery Paths)

Antigravity automatically discovers custom agent files across three levels:

| Scope | File Path | Recommended Use |
| :--- | :--- | :--- |
| **Project / Workspace** | `.agents/agents/<name>.md`<br>or `.agents/agents/<name>/agent.md` | **Highest priority.** Versioned in Git to share project specialists with the entire team. |
| **User Global** | `~/.gemini/config/agents/<name>.md`<br>or `~/.gemini/config/agents/<name>/agent.md` | Available across all projects on the user's local machine. |
| **Packaged Plugin** | `plugins/<plugin_name>/agents/<name>.md` | Distributed as part of an installable plugin. |

> Note: For temporary agents that should only exist during the active conversation without creating files on disk, use the `define_subagent` tool.

---

## 3. File Format and YAML Frontmatter Fields

Each agent is defined in a single `.md` file split into two parts:
1. **YAML Frontmatter Header (`---`):** Defines metadata, permissions, model, and tools.
2. **Markdown Body:** Compiled directly as the agent's **System Prompt**.

### Full Property Schema (YAML Frontmatter)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | *(Required)* | Unique agent identifier (lowercase and hyphen-separated, e.g., `dependency-modernizer`). |
| `description` | `string` | *(Required)* | Clear description of its specialty and when the coordinator agent should delegate tasks to it. |
| `mainAgent` | `boolean` | `true` | **Execution symmetry:** If `true`, allows selecting it directly as the session's main agent in the GUI or CLI. |
| `subagent` | `boolean` | `true` | **Execution symmetry:** If `true`, allows a coordinator agent to invoke it as a subagent via `invoke_subagent`. |
| `model` | `string` | `inherit` | Model assigned to the agent: `inherit` (inherits from parent/session), `flash`, `pro`, or `flash_lite`. |
| `tools` | `string[]` | `[]` | Explicit list of allowed tools (e.g., `view_file`, `write_to_file`, `replace_file_content`, `grep_search`, `find_by_name`, `list_dir`, `run_command`, `manage_task`). |
| `skills` | `string[]` | `[]` | Paths to skills the agent can use (e.g., `skills/package-upgrade-rules`, `skills/custom-agents`). |
| `plugins` | `string[]` | `[]` | Enabled plugin dependencies for this agent. |
| `mcpServers` | `object[]` | `[]` | Specific MCP servers configured for this agent. |
| `permissionMode` | `string` | *(Optional)* | Permission level for edits/actions (e.g., `acceptEdits`, `bypassPermissions`). |
| `commandExecutionPolicy` | `string` | `sandbox` | Auto-execution policy for terminal commands: `off`, `auto`, `eager`, or `sandbox`. With `auto`, it autonomously runs safe build/test commands in the background and requires manual approval only for destructive or high-risk commands. |

### Critical `tools` Validation Rule

Always verify the exact spelling of every tool listed in `tools` (for example: `view_file`, `write_to_file`, `replace_file_content`, `grep_search`, `find_by_name`, `list_dir`, `run_command`, `manage_task`). Specifying a nonexistent or misspelled tool name can cause the subagent process to hang on startup.

---

## 4. How They Are Invoked and Managed

Thanks to **execution symmetry** (`mainAgent: true` and `subagent: true`), the same `.md` file can run in two ways:

### A. As Main Agent (`mainAgent: true`)
You talk directly with the custom agent from the start of the session, adopting its System Prompt and frontmatter restrictions:
1. **In Antigravity 2.0 (Desktop App GUI):** Select it directly from the agents dropdown menu in the chat interface.
2. **In Antigravity CLI (`agy`):**
   - When launching from the command line:
     ```bash
     agy --agent <agent-name>
     ```
   - Inside an interactive session: run the `/agents` command to open the *Agent Manager* panel and switch the main agent.

### B. As Background Subagent (`subagent: true`)
A coordinator agent delegates asynchronous work without polluting its own context:
1. **Tool invocation (`invoke_subagent`):**
   The parent agent calls `invoke_subagent` passing:
   - `TypeName`: The `name` defined in the agent's frontmatter (e.g., `practices-auditor`).
   - `Role`: Descriptive title of the current mission (2 to 5 words).
   - `Prompt`: Actionable task and completion criteria.
   - `Model`: `inherit` (default), `flash`, `pro`, or `flash_lite`.
   - `Workspace`:
     - `inherit` (default): shares the parent's working directory.
     - `branch`: creates an isolated Git worktree to edit/build without collisions.
     - `share`: shares repository storage while allowing independent branches.
2. **Subagent Lifecycle:**
   - `Running`: Actively executing tools. Can be stopped from the subagents panel or with the `k` key in `/agents` (CLI).
   - `Idle`: Finished its task, sent its report to the parent, and paused (consumes zero tokens). If it receives a new message (`send_message` with its `conversationId` or `@` mention), it **wakes up automatically** preserving all its prior context.
   - `Killed`: Permanently terminated (`manage_subagents` with `kill` / `kill_all`); cleans up any temporary Git worktree while preserving the JSONL log.
3. **Direct User Interaction and CLI Shortcuts:**
   - **Direct mention:** Type `@<subagent-name> <instruction>` in chat or open its conversation in the subagents panel to give it orders without going through the parent agent.
   - **Deep inspection (`/agents`):** Use `↑/↓` and `Enter` to view internal thoughts, tool calls, and real-time logs (`Esc` to exit).
   - **Quick permission approval in CLI:**
     - `Alt + J`: Jumps the view directly to the detail of the next subagent awaiting manual approval.
     - `Ctrl + K`: Instantly approves (*fast-path*) the pending action shown in the status bar without switching panels.

---

## 5. Ready-to-Use Reference Template

```markdown
---
name: dependency-modernizer
description: "Updates local packages, runs the test suite, and verifies the build compiles without errors. Use when modernizing dependencies or resolving version conflicts."
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

# Main Instructions

You are a dependency modernization specialist. Your job is to inspect configuration files, update target packages, run the test suite, and verify that the build passes cleanly.

## Execution Rules
1. Always check for breaking changes before bumping major versions.
2. Run `npm run lint` and `npm run build` after each update.
3. If an update breaks the build, revert or fix the incompatibility before reporting.
```

---

## 6. Procedure to Create or Audit an Agent in This Project

1. **Location:** Create or edit the file at `.agents/agents/<name-in-kebab-case>.md`.
2. **Verify the principle of least privilege:**
   - If the agent is read-only/auditing (like `practices-auditor`), include only `view_file`, `grep_search`, `find_by_name`, `list_dir`, `run_command` (without `write_to_file` or `replace_file_content`).
   - If the agent modifies code (like `state-data-architect`, `ui-ux-specialist`, `ai-workflows-engineer`), enable `write_to_file` and `replace_file_content` and scope in its System Prompt which project paths it is allowed to touch.
3. **Sync with `AGENTS.md`:** If you add a new permanent agent to the project squad, register it in the specialized agents section of `AGENTS.md` at the root of the repository.
