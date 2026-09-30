# Third-party components

ChainWork uses the shadcn/ui composition pattern with Radix UI, Tailwind CSS,
class-variance-authority and application-owned React components.

## 000h by Cojeev

`src/components/ui/Presence.tsx` and `src/styles/presence.css` are sourced from
the [000h Presence registry](https://000h.cojeev.com/r/presence.json), retrieved
2026-09-30. Source: [Presence documentation](https://000h.cojeev.com/docs/presence/).
Adaptations: use the existing `framer-motion` runtime, a small local choreography
adapter and React 18-compatible exiting accessibility attributes. No global
000h theme or appearance engine is imported.

## Brand assets

The OpenAI mark (`public/openai.svg`) comes from Simple Icons 14.15.0 (CC0).
The Claude mark is supplied by `@icons-pack/react-simple-icons` (MIT; icon data
CC0). Brand marks remain the trademarks of their respective owners and identify
compatible clients; they do not imply endorsement.
