# Landing 2.0.2 verification — 2026-09-30

Scope: public landing and local component sources. No production data mutations,
backend changes, migrations, authentication changes or MCP server changes.

## Components

| Registry component | Landing use |
| --- | --- |
| Button / `button` | Navigation, CTAs, preview controls and MCP steps |
| Card / `card` | Workflow, sample projects and MCP preview |
| Badge / `badge` | Priority, status and example labels |
| Item / `item` | Interactive sample tasks and native static example rows |
| Tabs / `tabs` | Sample tasks/projects/context and workflow steps |
| Progress / `progress` | Sample milestone and project progress |
| Accordion / `accordion` | FAQ |
| Bento Grid / `bento-grid` | Responsive feature layout |
| Presence / `presence` | Hero and changing sample content |
| Agent State / `agent-state` | Context-ready and MCP example status |

Editable sources and adaptations: `src/components/landing/cojeev/SOURCES.md`.
The landing theme boundary maps registry tokens to ChainWork's black/graphite
and light palettes; selectors stay inside `.cw-landing`.

## Browser smoke test

Used the in-app browser with `tests/preview.config.ts` and an in-memory backend.
No production accounts or API keys were used.

- English and Spanish checked at 1440, 1280, 1024, 768, 390 and 320px. No horizontal document overflow or out-of-bounds headings, feature cards, workspace preview or navigation containers.
- Dark and light themes reviewed visually, including toggling repeatedly to verify morph paint follows the current theme.
- Sample task completion moves milestone progress from 1/4 to 2/4. Projects and Context change panels; only the selected preview panel remains mounted. Reset restores sample task progress and the Tasks view.
- Codex and Claude Code selection, direct MCP step selection and the final progress scene work. Example tools match existing server tools; no MCP calls are made by the demo.
- FAQ opens with the native accordion trigger. Mobile navigation opens as a labeled dialog; Escape closes it and restores the trigger state.
- Authenticated dashboard navigation reaches `/dashboard`; guest and authenticated CTA destinations are additionally covered by regression tests.
- Reduced-motion JavaScript preference tested through the opt-in `?reduced-motion=1` QA fixture. Real components expose quiet surfaces and the MCP step content appears immediately. Browser media emulation is unavailable in this driver; CSS reduced-motion rules were reviewed separately. This fixture is not included in the production build.
- No browser console errors observed during the landing review. React Router's existing future-flag warnings remain.

## Automated checks

- `npm run typecheck`: passed.
- `npm test`: 34 tests passed, including 3 new landing regressions with reduced motion enabled.
- `npm run build`: passed, including PWA generation.
- `git diff --check`: passed.

The landing route is approximately 89.4KB JavaScript (27.7KB gzip) and 42.6KB CSS
(8.1KB gzip). No dependencies were added. The existing application-wide bundle
and Chain route still trigger Vite's >500KB chunk warning; optimizing those
routes is outside this landing-only change.
