# Landing primitives from 000h / Cojeev

These editable React sources were copied from the official registry after reading each component's documentation. They are isolated here so the landing redesign does not replace the application's existing controls.

Upstream repository: https://github.com/luv-jeri/cojeev-ui

| Component | Source                                   | Documentation                           |
| --------- | ---------------------------------------- | --------------------------------------- |
| Button    | https://000h.cojeev.com/r/button.json    | https://000h.cojeev.com/docs/button/    |
| Card      | https://000h.cojeev.com/r/card.json      | https://000h.cojeev.com/docs/card/      |
| Badge     | https://000h.cojeev.com/r/badge.json     | https://000h.cojeev.com/docs/badge/     |
| Item      | https://000h.cojeev.com/r/item.json      | https://000h.cojeev.com/docs/item/      |
| Tabs      | https://000h.cojeev.com/r/tabs.json      | https://000h.cojeev.com/docs/tabs/      |
| Progress  | https://000h.cojeev.com/r/progress.json  | https://000h.cojeev.com/docs/progress/  |
| Accordion | https://000h.cojeev.com/r/accordion.json | https://000h.cojeev.com/docs/accordion/ |

Local adaptations:

- Existing shared Cojeev motion hooks and Presence are reused without duplicating them.
- Button adds an `icon` size; Accordion uses two direct Lucide imports instead of loading the entire registry icon catalog.
- `cojeev.css` retains the component, flow layer, disclosure, and progress-paint contracts while adapting their appearance to ChainWork's theme tokens. All selectors are scoped to `.cw-landing`. Registry demo styles and unused decorative color treatments are omitted.
- The components retain their upstream native/Radix interaction behavior, controlled tabs, refs, loading semantics, motion preference checks, and accessible progress values.
- Tabs lets Radix remove inactive panels immediately and uses a real MotionSurface wrapper for entrance animation. This avoids retained panels caused by forceMount with a motion Slot. Sample-only Item rows use their native `as="div"` option.
- Morph paint follows live theme tokens so toggling dark/light does not retain sampled colors. Workflow flow markers use a subtle rectangular surface suitable for multiline steps.
- Existing third-party notices and font licenses remain in `src/lib/cojeev/NOTICES.txt`, `src/styles/fonts/`, and the repository's `THIRD_PARTY_NOTICES.md`.
