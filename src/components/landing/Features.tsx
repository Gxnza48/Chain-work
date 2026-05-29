import { Activity, Folders, Lightbulb, ListChecks, Paperclip, type LucideIcon } from 'lucide-react';
import { motion, popVariants, staggerContainer, Reveal, VIEWPORT } from './Motion';
import { cn } from '@/lib/utils';

interface FeatureCard {
  title: string;
  body: string;
  icon: LucideIcon;
  accent: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
  span?: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Real-time presence',
    body: "See teammates land in a chain the moment they arrive. Built on a single presence channel — never polled.",
    icon: Activity,
    accent: 'emerald',
    span: true,
  },
  {
    title: 'Projects & Roadmap',
    body: 'Up to 25 projects per chain. Completed todos automatically flow into an append-only Roadmap.',
    icon: Folders,
    accent: 'blue',
  },
  {
    title: 'Ideas board',
    body: 'Capture loose thoughts with rich text. Vote them up or down — one vote per teammate, changeable.',
    icon: Lightbulb,
    accent: 'amber',
  },
  {
    title: 'Smart todos',
    body: 'Pending, in progress, done — with drag-and-drop reordering and assignees that map to your chain.',
    icon: ListChecks,
    accent: 'violet',
  },
  {
    title: 'Link & media attachments',
    body: 'Repos, images, videos, and links — each detected and shown with the right preview.',
    icon: Paperclip,
    accent: 'rose',
  },
];

const ACCENT_BG: Record<FeatureCard['accent'], string> = {
  blue: 'bg-accent-blue',
  violet: 'bg-accent-violet',
  emerald: 'bg-accent-emerald',
  amber: 'bg-accent-amber',
  rose: 'bg-accent-rose',
};

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-28 py-24 md:py-32 bg-surface border-y-2 border-fg">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-accent-violet">
            What's inside
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Just the shape of work — nothing extra.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Chains, members, projects, todos, ideas, attachments, presence. We made deliberate choices about what
            <em> not</em> to build.
          </p>
        </Reveal>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                variants={popVariants}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
                className={cn('brut-card p-6 flex flex-col gap-4', f.span ? 'md:col-span-2' : '')}
              >
                <span
                  className={cn(
                    'grid h-12 w-12 place-items-center rounded-lg border-2 border-fg text-white shadow-brut-sm',
                    ACCENT_BG[f.accent],
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </span>
                <h3 className="font-display text-2xl font-bold tracking-tight">{f.title}</h3>
                <p className="text-base leading-relaxed text-fg-muted">{f.body}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
