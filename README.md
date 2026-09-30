# ChainWork 2.0

A focused workspace for teams, projects and AI assistants. Chains bring together projects, tasks, milestones, ideas, chat and shared files in a black and graphite interface. Codex and Claude Code share the same project context through MCP.

[Live app](https://chainwork-team.vercel.app) · [Changelog](CHANGELOG.md) · [MCP setup](supabase/functions/mcp/README.md)

## Development

Requires Node.js 22+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set the public Supabase URL and anon key in `.env.local`. Keep service-role keys and server secrets out of `VITE_*` variables. Retain existing production environment variables.

```sh
npm test
npm run typecheck
npm run build
npx deno check supabase/functions/mcp/index.ts
```

For UI review with an isolated, in-memory workspace:

```sh
npx vite --config tests/preview.config.ts
```

Open `http://127.0.0.1:5174/dashboard`. The fixture is selected only by this separate development config. It never authenticates with or writes to Supabase. The production config uses the real backend.

## Interface

- React, TypeScript, Tailwind and Radix primitives with shadcn-compatible tokens and `components.json`.
- Geist typography, subtle surfaces, GSAP landing transitions and an adapted 000h Presence component. Reduced-motion preferences are respected.
- Workspace tabs and selected projects are represented in the URL, including existing `?project=` links.
- All tasks spans the entire chain, with project filters and explicit project selection for new tasks. Project views retain individual task scope and ordering.
- Profile settings live in Settings; milestones and activity have their own project tabs. Members open in a panel without narrowing the workspace.
- Spanish and English, responsive navigation, keyboard controls, realtime updates and existing account features.

## Deployment and data

The web app deploys from `main` to the existing Vercel project. The MCP function deploys separately; see its README. Version 2.0 changes application code only: **no migrations, resets, record rewrites or credential rotations are required**. Retain existing Supabase tables, RLS policies, storage, auth settings and Vercel secrets.

MCP tests cover authorization, validation and official SDK transport compatibility. Task-view tests cover chain boundaries, project scopes, search and failure recovery.

Nonbreaking dependency fixes are included. The inherited dependency tree still has audit findings requiring major upgrades (notably Tiptap, React Router and build tooling); this release does not claim a clean security audit. Forced major upgrades are outside this visual and workflow rework.

## Third-party assets

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for motion and icon attribution. Product marks identify compatible clients and do not imply endorsement.

## License

Built by the ChainWork team. Released for the community to read and learn from.
