# ChainWork

A collaborative productivity web app where small teams build together in shared
workspaces called **chains**. Each chain has a unique 8‑character code, real-time
presence, projects with append‑only roadmaps, drag‑and‑drop todos, an upvoteable
ideas board, and link/media attachments — wrapped in a confident neo‑brutalist UI.

> Between Notion's flexibility and Linear's structure — clean, fast, modern.

## Tech stack

**Frontend**

- React 18 + TypeScript (strict, no `any`)
- Vite 5
- Tailwind CSS (custom neo-brutalist tokens)
- shadcn-style primitives re-skinned to brutalism (Radix-based)
- lucide-react (individual imports)
- GSAP + ScrollTrigger
- Lenis (smooth scroll, GSAP-synced)
- Sonner (toasts)
- React Router v6
- Zustand (auth + theme only)
- @dnd-kit/core (pending todo reordering)
- Tiptap (bold / italic / bullet list — idea descriptions only)

**Backend**

- Supabase Postgres (8 tables, all with RLS enabled)
- Supabase Auth — email + password only, email confirmation **mandatory**
- Supabase Realtime — one presence channel per chain (`chain:{chainId}`)
- Supabase Storage — three buckets: `avatars`, `attachments`, `videos`

## Local development

```bash
git clone https://github.com/Gxnza48/Chain-work.git
cd Chain-work
npm install
cp .env.example .env
# Fill in your Supabase project URL and anon key
npm run dev
```

Visit <http://localhost:5173>.

`npm run typecheck` runs strict TS without emit.
`npm run build` runs the production build.
`npm run preview` previews the built bundle.

## Supabase setup

1. **Create a project** in the Supabase dashboard.
2. **Run migrations in order** (Dashboard → SQL Editor, paste each file):
   1. `supabase/migrations/0001_schema.sql` — tables, enums, indexes
   2. `supabase/migrations/0002_triggers.sql` — profile bootstrap + 25-project cap
   3. `supabase/migrations/0003_rls.sql` — row-level security (enables RLS on every table)
   4. `supabase/migrations/0004_join_rpc.sql` — idempotent `join_chain_by_code` RPC
   5. `supabase/migrations/0005_storage.sql` — `avatars`, `attachments`, `videos` buckets + policies
3. **Authentication settings** (Dashboard → Authentication → Providers):
   - Enable **Email** provider.
   - Disable every OAuth provider.
   - Require **email confirmation** for new sign-ups.
4. **Branded email templates** (Authentication → Email Templates) — paste the
   HTML from `supabase/email-templates/`:
   - `confirm.html` → "Confirm signup"
   - `recovery.html` → "Reset Password"
   - `magic-link.html` → "Magic Link" (optional)
5. **Storage** — the migration creates the buckets. In the Storage dashboard,
   set the **`videos` bucket file-size limit to 50 MB** (the client also rejects
   larger uploads).
6. **Copy your project URL + anon key** into `.env`:
   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-KEY
   ```

### Verifying RLS

After running migrations, an unauthenticated request and a non-member request
should both return **zero rows** for chain-scoped tables (`projects`, `todos`,
`ideas`, `idea_votes`, `attachments`). This is the canonical test that
row-level security is wired correctly.

## Deployment

### Vercel (recommended)

1. Import the repo on Vercel.
2. Framework preset → **Vite**.
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Push to `main` → auto-deploy.

### Netlify

1. Connect the repo.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Same env vars as Vercel.

## Repository structure

```
chainwork/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/            ← shadcn primitives re-skinned to brutalism
│   │   ├── layout/        ← Navbar, AppShell, Footer, ScrollProgress, ThemeToggle, AuthGuard, Logo
│   │   ├── landing/       ← Hero, HowItWorks, Features, FAQ
│   │   ├── auth/          ← LoginForm, RegisterForm, PasswordStrength
│   │   ├── dashboard/     ← ProfileCard, ChainCard, CreateChainModal, JoinChainModal
│   │   ├── chain/         ← ChainHeader, MembersPanel, PresenceBadge
│   │   ├── project/       ← ProjectCard, ProjectListView, ProjectView, Roadmap, CreateProjectModal
│   │   ├── todos/         ← TodoForm, TodoItem, TodoList
│   │   ├── ideas/         ← IdeaCard, IdeaForm, IdeaList, RichTextEditor
│   │   └── attachments/   ← AttachmentCard, AttachmentList, AttachmentUploader
│   ├── hooks/             ← useAuth, useChain, usePresence, useTheme, useScrollProgress, useRelativeTimeTick
│   ├── lib/               ← supabase, gsap, lenis, utils
│   ├── pages/             ← Landing, Auth, Dashboard, Settings, Chain, NotFound
│   ├── store/             ← Zustand (auth + theme only)
│   ├── types/             ← Supabase types + domain types
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── supabase/
│   ├── migrations/        ← 0001..0005
│   └── email-templates/   ← confirm.html · recovery.html · magic-link.html
├── .env.example
├── tailwind.config.ts     ← brutalist tokens, fonts, shadow utilities
├── tsconfig.json          ← strict: true
├── vite.config.ts
├── postcss.config.js
└── package.json
```

## Design rules

- **Two themes** (dark default + warm-paper light), **five accents** (blue / violet / emerald / amber / rose).
- **Thick borders, hard offset shadows** — never blurred, never glassmorphic.
- **Animations animate transform + opacity only.** No layout-affecting properties.
- **Realtime presence is channel-only.** No "online" flag in Postgres; no polling.
- **Roadmap is append-only.** Completed todos can't be deleted; re-opening removes
  them from the Roadmap until they're completed again.
- **Project cap of 25 per chain** — enforced both client-side (UX) and server-side
  (DB trigger).

## License

Built by the ChainWork team. Released for the community to read and learn from.
