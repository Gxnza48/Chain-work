# Changelog

## 2.0.1 — 2026-09-30

### 000h interaction layer

- Migrated the frontend to React 19 and Tailwind CSS 4 with the official Vite integration.
- Added 000h Agent State to the MCP integrations panel, Scroll Reveal to the landing hero, and Empty states to task loading, filtered and first-use views.
- Bridged the existing theme store to the 000h `data-mode` contract and preserved reduced-motion behavior across generated components.
- Added the 000h component support files and registry notices without changing the database schema or existing user data.

## 2.0.0 — 2026-09-30

### A clearer workspace

- Replaced neo-brutalism with a black and graphite visual system, Geist typography, restrained borders and shadcn-compatible primitives.
- Rebuilt the landing with an interactive product preview, Codex and Claude Code marks, bilingual content, accessible motion and 000h Presence transitions.
- Refocused the dashboard on chains and recent projects, with search and clear loading/error states.
- Added shareable workspace tabs and project URLs; preserved existing project links and browser history behavior.
- Moved members into a panel and separated project milestones and activity from task work.
- Fixed All tasks to include every project in the chain. Added project filters, context on rows and explicit project selection for new tasks.
- Grouped secondary task actions into a menu and made advanced filters collapsible. Editing, labels, subtasks, attachments and bulk actions remain available.
- Improved mobile navigation with accessible dialogs and focus containment. Added a public bilingual changelog.

### MCP 2.0

- Preserved the deployed `dynamic-task` endpoint, API keys and original ten tools.
- Added eight tools for projects, members, comments, subtasks and milestones.
- Added task search, assignment filters and pagination; preserved PostgreSQL status ordering for next-task selection.
- Added argument validation and checks for membership, project ownership and milestone/project consistency.
- Added structured results, tool annotations, protocol negotiation and stateless Streamable HTTP behavior verified with the official MCP SDK.
- Added separate Codex TOML and Claude Code JSON setup examples using `CHAINWORK_API_KEY`.

### Preservation and verification

- No database migrations or schema changes. Existing users, chains, projects, tasks, files, comments, history and keys are retained.
- Added regression tests for task scopes, navigation, authorization, validation and MCP transport.
- Added an isolated UI fixture for responsive checks without production writes.
- Applied available nonbreaking dependency fixes; major-version audit findings remain documented in README.
