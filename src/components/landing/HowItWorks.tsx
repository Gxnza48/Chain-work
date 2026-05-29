import { KeySquare, Send, Users, type LucideIcon } from 'lucide-react';
import { motion, popVariants, staggerContainer, Reveal, VIEWPORT } from './Motion';

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: KeySquare,
    title: 'Create a chain',
    body: "Spin up a private workspace in seconds. We hand you a unique 8-character code — no settings to wrestle with.",
  },
  {
    icon: Send,
    title: 'Invite your team',
    body: 'Share the code. Teammates join instantly, see the same projects, todos, and ideas in real time.',
  },
  {
    icon: Users,
    title: 'Build together',
    body: 'Plan with projects, capture ideas, knock out todos, and ship — with presence baked in so you know who is around.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-28 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-accent-blue">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Three steps. No setup tax.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            ChainWork is built around one idea: shared spaces that are trivial to create and instant to join.
          </p>
        </Reveal>

        <motion.ol
          className="mt-14 grid gap-6 md:grid-cols-3"
          variants={staggerContainer(0.14)}
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
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
                className="brut-card flex flex-col gap-4 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  <span className="font-mono text-3xl font-bold text-fg-muted">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight">{step.title}</h3>
                <p className="text-base leading-relaxed text-fg-muted">{step.body}</p>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
