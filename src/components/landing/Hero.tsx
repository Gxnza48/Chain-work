import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { gsap, ScrollTrigger, registerGsap } from '@/lib/gsap';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { prefersReducedMotion } from '@/lib/utils';

const HEADLINE = 'Build together in shared chains.';

export function Hero() {
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const mockupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const words = headRef.current?.querySelectorAll<HTMLSpanElement>('[data-word]') ?? [];
      gsap.set(words, { yPercent: 110, opacity: 0 });
      gsap.set([subRef.current, ctaRef.current, eyebrowRef.current], { y: 18, opacity: 0 });
      gsap.set(mockupRef.current, { y: 30, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to(eyebrowRef.current, { y: 0, opacity: 1, duration: 0.5 })
        .to(
          words,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
          },
          '-=0.25',
        )
        .to(subRef.current, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2')
        .to(ctaRef.current, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
        .to(mockupRef.current, { y: 0, opacity: 1, duration: 0.7 }, '-=0.4');
    }, headRef);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  function handleSeeHow(e: React.MouseEvent) {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section
      aria-label="Hero"
      className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 grid-bg noise"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <div
          ref={eyebrowRef}
          className="mb-6 inline-flex"
          style={{ opacity: 0 }}
        >
          <Badge variant="blue" className="border-fg shadow-brut-sm">
            <Sparkles className="h-3 w-3" />
            Now in beta · realtime collaboration
          </Badge>
        </div>

        <h1
          ref={headRef}
          className="font-display text-5xl font-bold tracking-tight text-fg leading-[0.95] sm:text-6xl md:text-7xl lg:text-[7rem]"
          style={{ letterSpacing: '-0.04em' }}
        >
          {HEADLINE.split(' ').map((w, i) => (
            <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom mr-[0.2em]">
              <span data-word className="inline-block will-change-transform">
                {w}
              </span>
            </span>
          ))}
        </h1>

        <p
          ref={subRef}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl"
          style={{ opacity: 0 }}
        >
          A web app where small teams build together, in shared chains. Between Notion's flexibility and
          Linear's structure — clean, fast, modern.
        </p>

        <div
          ref={ctaRef}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ opacity: 0 }}
        >
          <Button asChild size="lg">
            <Link to="/auth?mode=register">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" onClick={handleSeeHow}>
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <div ref={mockupRef} className="mt-16 md:mt-24" style={{ opacity: 0 }}>
          <HeroMockup />
        </div>
      </div>
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
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_220px] divide-fg/30 md:divide-x-2">
          <div className="hidden md:flex flex-col gap-2 p-4 border-r-2 border-fg/30">
            <p className="font-display font-bold text-xs uppercase tracking-wider text-fg-muted">Workspace</p>
            <div className="rounded-md border-2 border-fg bg-accent-blue px-3 py-1.5 text-xs font-bold text-white shadow-brut-sm">
              Projects
            </div>
            <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-fg-muted">Ideas</div>
            <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-fg-muted">All Todos</div>
          </div>
          <div className="p-5 space-y-3">
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
