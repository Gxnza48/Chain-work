import { ArrowRight, MessageSquareText, Plug, Rocket, TerminalSquare, type LucideIcon } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { motion, popVariants, staggerContainer, Reveal, VIEWPORT } from './Motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Accent = 'blue' | 'violet' | 'emerald';

interface Step {
  icon: LucideIcon;
  accent: Accent;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Plug,
    accent: 'blue',
    title: 'Connect once',
    body: 'Add the ChainWork MCP server to Claude Code with one command and an API key you generate in Settings.',
  },
  {
    icon: MessageSquareText,
    accent: 'violet',
    title: 'Ask in plain language',
    body: "Tell Claude Code to take your chain's next task. It pulls the title, description and priority straight from ChainWork.",
  },
  {
    icon: Rocket,
    accent: 'emerald',
    title: 'It ships and checks it off',
    body: 'Claude writes the code, pushes to GitHub, and flips the task to done — your whole chain sees it update in real time.',
  },
];

const ACCENT_BG: Record<Accent, string> = {
  blue: 'bg-accent-blue',
  violet: 'bg-accent-violet',
  emerald: 'bg-accent-emerald',
};

// The actual tools the MCP server exposes to Claude Code.
const TOOLS = [
  'list_chains',
  'list_tasks',
  'get_next_task',
  'get_task',
  'create_task',
  'update_task',
  'set_task_status',
  'complete_task',
  'add_comment',
  'whoami',
];

function Terminal({ promptText }: { promptText: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-lg border-2 border-fg shadow-brut">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b-2 border-fg bg-[#161b22] px-4 py-3">
        <span aria-hidden className="h-3 w-3 rounded-full border border-black/40 bg-accent-rose" />
        <span aria-hidden className="h-3 w-3 rounded-full border border-black/40 bg-accent-amber" />
        <span aria-hidden className="h-3 w-3 rounded-full border border-black/40 bg-accent-emerald" />
        <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <TerminalSquare className="h-3.5 w-3.5" /> chainwork — claude code
        </span>
      </div>
      {/* body */}
      <div className="bg-[#0d1117] p-5 font-mono text-[13px] leading-relaxed text-slate-300 sm:text-sm">
        <p className="whitespace-pre-wrap break-all">
          <span className="text-accent-emerald">$</span> claude mcp add chainwork \
        </p>
        <p className="break-all pl-3 text-slate-400">--header "Authorization: Bearer cw_live_••••"</p>
        <p className="mt-1 text-accent-emerald">✓ chainwork connected · 10 tools</p>
        <p aria-hidden className="h-3" />
        <p className="break-words">
          <span className="text-accent-blue">›</span> <span className="text-slate-100">{promptText}</span>
        </p>
        <p className="mt-1 text-slate-500">
          → get_next_task <span className="text-slate-300">· "Monetizar la web"</span>
        </p>
        <p className="text-slate-500">
          → <span className="text-slate-300">writing code…</span>
        </p>
        <p className="text-slate-500">
          → git push origin main <span className="text-accent-emerald">✓</span>
        </p>
        <p className="text-slate-500">
          → complete_task <span className="text-accent-emerald">✓ done</span>
          {reduce ? null : (
            <motion.span
              aria-hidden
              className="ml-1 inline-block text-accent-emerald"
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              ▋
            </motion.span>
          )}
        </p>
      </div>
    </div>
  );
}

export function Developers() {
  const t = useT();
  const { user } = useAuth();
  const authed = Boolean(user);

  return (
    <section id="developers" className="relative scroll-mt-28 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent-emerald">
            {t('For developers')}
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {t('Your coding agent, plugged into ChainWork.')}
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            {t(
              'Connect Claude Code over MCP, point it at a chain, and let it run: it reads the next task, writes the code, pushes to GitHub, and marks it completed.',
            )}
          </p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          {/* Terminal mockup */}
          <Reveal className="flex">
            <div className="w-full self-center">
              <Terminal promptText={t('do the next task in my chain and ship it')} />
            </div>
          </Reveal>

          {/* Step flow */}
          <motion.ol
            className="flex flex-col gap-4"
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  variants={popVariants}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
                  className="brut-card flex items-start gap-4 p-5"
                >
                  <span
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 border-fg text-white shadow-brut-sm',
                      ACCENT_BG[step.accent],
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-fg-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-display text-xl font-bold tracking-tight">{t(step.title)}</h3>
                    </div>
                    <p className="mt-1 text-[15px] leading-relaxed text-fg-muted">{t(step.body)}</p>
                  </div>
                </motion.li>
              );
            })}
          </motion.ol>
        </div>

        {/* Tool cloud */}
        <Reveal className="mt-6">
          <div className="brut-card p-6">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
              {t('Tools your agent gets')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-surface-2 px-2.5 py-1 font-mono text-xs font-semibold text-fg shadow-brut-sm"
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal className="mt-8 flex flex-col items-center gap-3 text-center">
          <Button asChild size="lg" variant="primary">
            <Link to={authed ? '/settings' : '/auth?mode=register'}>
              {t(authed ? 'Get your API key' : 'Get started free')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-fg-muted">
            {t('Free · hosted on Supabase Edge · works with Claude Code')}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
