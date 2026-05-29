import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const HEADLINE = 'Build together in shared chains.';
const HEADLINE_WORDS = HEADLINE.split(' ');

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: '105%' },
  show: { opacity: 1, y: '0%', transition: { type: 'spring', stiffness: 200, damping: 24 } },
};

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  function handleSeeHow(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section
      aria-label="Hero"
      ref={sectionRef}
      className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 grid-bg"
    >
      <motion.div
        className="relative mx-auto max-w-7xl px-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={rise} className="mb-6 inline-flex">
          <Badge variant="blue" className="border-fg shadow-brut-sm">
            <Sparkles className="h-3 w-3" />
            Now in beta · realtime collaboration
          </Badge>
        </motion.div>

        <h1
          className="font-display text-5xl font-bold tracking-tight text-fg leading-[0.95] sm:text-6xl md:text-7xl lg:text-[7rem]"
          style={{ letterSpacing: '-0.04em' }}
        >
          {HEADLINE_WORDS.map((w, i) => (
            <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom">
              <motion.span variants={word} className="inline-block">
                {w}
              </motion.span>
              {i < HEADLINE_WORDS.length - 1 ? <span>&nbsp;</span> : null}
            </span>
          ))}
        </h1>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl"
        >
          A web app where small teams build together, in shared chains. Between Notion's flexibility and
          Linear's structure — clean, fast, modern.
        </motion.p>

        <motion.div variants={rise} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link to="/auth?mode=register">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" onClick={handleSeeHow}>
            <a href="#how-it-works">See how it works</a>
          </Button>
        </motion.div>

        <motion.div variants={rise} className="mt-16 md:mt-24">
          <motion.div style={{ y: mockupY }} className="will-change-transform">
            <HeroMockup />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="rounded-lg border-2 border-fg bg-surface shadow-brut-lg overflow-hidden">
        <div className="flex items-center gap-2 border-b-2 border-fg bg-surface-2 px-4 py-2">
          <span className="h-3 w-3 rounded-full border-2 border-fg bg-accent-rose" />
          <span className="h-3 w-3 rounded-full border-2 border-fg bg-accent-amber" />
          <span className="h-3 w-3 rounded-full border-2 border-fg bg-accent-emerald" />
          <span className="ml-3 truncate font-mono text-xs text-fg-muted">chainwork.app / chain / 7K2NPQXA</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_220px]">
          <div className="hidden md:flex flex-col gap-2 p-4 border-r-2 border-fg/30">
            <p className="font-display font-bold text-xs uppercase tracking-wider text-fg-muted">Workspace</p>
            <div className="rounded-md border-2 border-fg bg-accent-blue px-3 py-1.5 text-xs font-bold text-white shadow-brut-sm">
              Projects
            </div>
            <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-fg-muted">Ideas</div>
            <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-fg-muted">All Todos</div>
          </div>
          <div className="p-5 space-y-3 border-t-2 md:border-t-0 md:border-r-2 border-fg/30">
            <p className="font-display font-bold text-lg">Launchpad</p>
            <div className="flex items-center gap-3 rounded-md border-2 border-fg bg-surface-2 p-3">
              <span className="h-3 w-3 rounded-full bg-accent-amber border-2 border-fg" />
              <span className="text-sm font-medium">Wire up auth guard</span>
              <span className="ml-auto font-mono text-xs text-fg-muted">in_progress</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border-2 border-fg bg-surface-2 p-3">
              <span className="h-3 w-3 rounded-full bg-accent-emerald border-2 border-fg" />
              <span className="text-sm font-medium line-through opacity-60">Design members panel</span>
              <span className="ml-auto font-mono text-xs text-fg-muted">done</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border-2 border-fg bg-surface-2 p-3">
              <span className="h-3 w-3 rounded-full bg-fg-muted border-2 border-fg" />
              <span className="text-sm font-medium">Plan launch tweet</span>
              <span className="ml-auto font-mono text-xs text-fg-muted">pending</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-2 p-4">
            <p className="font-display font-bold text-xs uppercase tracking-wider text-fg-muted">Members</p>
            <Member name="Alex" role="online" color="emerald" />
            <Member name="Sam" role="online" color="emerald" />
            <Member name="Jordan" role="offline" color="muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Member({ name, role, color }: { name: string; role: string; color: 'emerald' | 'muted' }) {
  return (
    <div className="flex items-center gap-2 rounded-md border-2 border-fg bg-surface-2 px-2 py-1.5">
      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-fg bg-accent-blue text-[10px] font-bold text-white">
        {name[0]}
      </span>
      <div className="flex-1">
        <p className="text-xs font-bold leading-none">{name}</p>
        <p className="font-mono text-[10px] text-fg-muted">{role}</p>
      </div>
      <span
        className={
          color === 'emerald'
            ? 'h-2 w-2 rounded-full bg-accent-emerald'
            : 'h-2 w-2 rounded-full bg-fg-muted'
        }
      />
    </div>
  );
}
