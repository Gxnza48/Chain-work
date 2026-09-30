# Changelog

## 2.0.3 — 2026-09-30

### Mobile motion and shared Cojeev application controls

- Trigger landing section and individual feature-card entrances when they enter the viewport; off-screen entrances no longer finish during the initial load. Retain immediate content for reduced motion and disabled flow preferences.
- Add native smooth anchor navigation, visible touch press feedback, compact mobile feature art and 44px application touch targets.
- Promote the existing registry components to `src/components/cojeev/`; application Button, Card, Badge, Tabs and Progress now delegate to those actual sources while preserving their existing props, native form submission, handlers and semantic status colors.
- Install real registry Input, Avatar, Checkbox, Skeleton, Animated Number, Breadcrumb and Hero Button components. Use fields, avatars and loading states throughout the app; native Item task rows and touch-friendly status buttons; checkboxes in bulk task selection and subtasks; counters in project statistics, project cards, chains and landing milestone progress; breadcrumbs in chains; Hero Button and avatars in the landing.
- Separate the appearance provider from the settings UI so settings controls and their icon dependencies can load on demand. Keep persisted preferences and portalled controls working.
- Stabilize the translation hook between language changes to prevent translation-dependent loaders, especially subtasks, from repeatedly reloading and blocking the view.
- Preserve task status cycles, drag-and-drop, filters, permissions, authentication and database/API behavior. No migrations or production data mutations.
- Add integration coverage for keyboard tab selection, checkboxes, native inputs, disabled slotted links and existing form submission semantics.

## 2.0.2 — 2026-09-30

### Landing rebuilt with 000h / Cojeev

- Rebuilt the landing in black and graphite with a responsive hero, workflow tabs, balanced Bento Grid, MCP walkthrough, FAQ and footer.
- Adapted real registry Button, Card, Badge, Item, Tabs, Progress and Accordion sources to ChainWork, alongside existing Presence, Bento Grid and Agent State components. Styles are scoped to the landing and preserve dark/light themes.
- Added a local interactive workspace sample with task completion, project filters, a project brief and milestone progress. Added user-controlled Codex / Claude Code selection and four accurate MCP example steps.
- Completed English and Spanish copy, keyboard navigation, mobile dialog focus and reduced-motion behavior. Fixed retained inactive tab panels and morph colors after a theme change.
- Preserved existing authentication destinations and all application, database and MCP behavior. Landing examples do not read or write user data.
- Added regression coverage for guest/authenticated links, sample progress, exclusive tab panels, both assistants, Spanish and reduced motion.

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
