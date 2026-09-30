# Shared ChainWork primitives from 000h / Cojeev

These editable React sources were copied from the official registry after reading each component's documentation. They are shared by the landing and application. Compatibility adapters in src/components/ui preserve existing callers and form behavior.

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

- Input: https://000h.cojeev.com/r/input.json — https://000h.cojeev.com/docs/input/
- Avatar: https://000h.cojeev.com/r/avatar.json — https://000h.cojeev.com/docs/avatar/
- Checkbox: https://000h.cojeev.com/r/checkbox.json — https://000h.cojeev.com/docs/checkbox/
- Skeleton: https://000h.cojeev.com/r/skeleton.json — https://000h.cojeev.com/docs/skeleton/
- Animated Number: https://000h.cojeev.com/r/animated-number.json — https://000h.cojeev.com/docs/animated-number/
- Breadcrumb: https://000h.cojeev.com/r/breadcrumb.json — https://000h.cojeev.com/docs/breadcrumb/
- Hero Button: https://000h.cojeev.com/r/hero-button.json — https://000h.cojeev.com/docs/hero-button/

Application adaptations (2.0.3):
- Native refs, input attributes, form submission and semantic variant props stay available through application adapters.
- New component state styles live in src/styles/cojeev; chainwork-controls.css applies monochrome themes, status colors and touch targets, including portalled UI.
- Input, Avatar and Breadcrumb documentation was unavailable through the website; their official repository contracts were read from reference/cojeev-handoff-v4/entries/{slug}/contract.md before installation.
- Direct Lucide X, ChevronRight and ArrowLeft imports replace full catalogue imports in Input/Breadcrumb.
- Presence adds opt-in viewport entrances. Default lifecycle behavior is preserved for dialogs and existing tabs. Reduced motion and disabled flow keep content immediately visible.
- Registry Checkbox depends on @radix-ui/react-checkbox; the shared selector helper is retained in src/lib/cojeev/selector.tsx.

- Item accepts native HTMLElement refs for its documented polymorphic `as` option; task rows render as real list items and keep sortable refs on the same element.
