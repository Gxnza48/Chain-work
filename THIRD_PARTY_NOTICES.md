# Third-party components

ChainWork uses the shadcn/ui composition pattern with Radix UI, Tailwind CSS,
class-variance-authority and application-owned React components.

## 000h by Cojeev

`src/components/ui/Presence.tsx`, `src/components/ui/agent-state.tsx`,
`src/components/ui/scroll-reveal.tsx`, `src/components/ui/empty.tsx` and their
supporting styles are sourced from the [000h registry](https://000h.cojeev.com/),
retrieved 2026-09-30. Sources: [Presence](https://000h.cojeev.com/docs/presence/),
[Agent State](https://000h.cojeev.com/docs/agent-state/), [Scroll Reveal](https://000h.cojeev.com/docs/scroll-reveal/)
and [Empty](https://000h.cojeev.com/docs/empty/). The generated components use
the `motion` runtime, the local choreography adapter and the existing ChainWork
theme bridge. Their documented reduced-motion behavior remains enabled. The
registry's font license files and notices are kept in `src/styles/fonts` and
`src/lib/cojeev/NOTICES.txt`.

The landing also adapts the official registry Button, Card, Badge, Item, Tabs,
Progress and Accordion sources in `src/components/landing/cojeev/`. Their source
URLs and component documentation are listed in that directory's `SOURCES.md`.
Existing 000h Bento Grid is reused for the feature layout. Adaptations include
landing-scoped monochrome tokens, direct icon imports, native noninteractive
sample items and Radix-owned removal of inactive tab panels.

## Brand assets

The OpenAI mark (`public/openai.svg`) comes from Simple Icons 14.15.0 (CC0).
The Claude mark is supplied by `@icons-pack/react-simple-icons` (MIT; icon data
CC0). Brand marks remain the trademarks of their respective owners and identify
compatible clients; they do not imply endorsement.
