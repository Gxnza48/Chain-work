import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Github } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Logo } from './Logo';
import { Button } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';

const LINK_GROUPS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'GitHub', href: 'https://github.com/Gxnza48/Chain-work', external: true },
    ],
  },
];

export function Footer() {
  const { user, loading } = useAuth();
  const t = useT();
  const rootRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'end end'],
  });
  const wordmarkY = useTransform(scrollYProgress, [0, 1], ['30%', '0%']);
  const wordmarkOpacity = useTransform(scrollYProgress, [0, 0.6], [0.15, 1]);

  return (
    <footer ref={rootRef} className="relative overflow-hidden border-t-2 border-fg bg-surface">
      {/* CTA band */}
      <div className="border-b-2 border-fg/30">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {t('Ready to build together?')}
            </h2>
            <p className="mt-2 max-w-md text-fg-muted">
              {t('Spin up a chain, share the code, and start shipping with your team in minutes.')}
            </p>
          </div>
          {loading ? null : (
            <Button asChild size="lg">
              <Link to={user ? '/dashboard' : '/auth?mode=register'}>
                {user ? t('Open dashboard') : t('Get started free')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-3 md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
          <Logo size="md" to="/" />
          <p className="max-w-sm text-sm text-fg-muted">
            {t('A web app where small teams build together, in shared chains.')}
          </p>
          <a
            href="https://github.com/Gxnza48/Chain-work"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border-2 border-fg bg-surface-2 px-3 py-1.5 text-sm font-semibold shadow-brut-sm transition-colors hover:bg-surface"
          >
            <Github className="h-4 w-4" />
            {t('Star on GitHub')}
          </a>
        </div>

        {LINK_GROUPS.map((group) => (
          <nav key={group.heading} className="flex flex-col gap-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">
              {t(group.heading)}
            </h3>
            <ul className="flex flex-col gap-2 text-sm font-semibold">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    className="text-fg-muted transition-colors hover:text-fg"
                  >
                    {t(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Made-in-Argentina credit — flag via flagcdn (emoji flags don't render on desktop) */}
      <div className="border-t-2 border-fg/30">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-5 text-center text-sm font-semibold text-fg-muted">
          <Flag code="ar" alt="Argentina" className="h-3.5 w-5 rounded-[2px] border border-fg/40" />
          <span>{t('Made in Argentina by Gonzalo Bonadeo & Agustin Casal')}</span>
        </div>
      </div>

      {/* Giant wordmark — the closing flourish of the page. Centered, full-bleed,
          outlined + faintly filled so it reads clearly in both light and dark,
          and clipped at the bottom edge like Discord's landing. */}
      <div className="relative -mt-2 w-full overflow-hidden">
        <motion.div
          aria-hidden
          style={{
            y: wordmarkY,
            opacity: wordmarkOpacity,
            fontSize: 'clamp(3rem, 16vw, 15rem)',
            marginBottom: '-0.1em',
            color: 'var(--wordmark-fill)',
            WebkitTextStroke: '2px var(--wordmark-stroke)',
          }}
          className="pointer-events-none w-full select-none whitespace-nowrap text-center font-display font-bold leading-[0.8] tracking-[-0.04em]"
        >
          ChainWork.
        </motion.div>
      </div>
    </footer>
  );
}
