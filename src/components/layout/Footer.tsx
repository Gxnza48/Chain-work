import { Github } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t-2 border-fg bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <Logo size="md" />
          <p className="max-w-sm text-sm text-fg-muted">
            A web app where small teams build together, in shared chains.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
          <a href="#features" className="text-fg-muted hover:text-fg transition-colors">
            Features
          </a>
          <a href="#faq" className="text-fg-muted hover:text-fg transition-colors">
            FAQ
          </a>
          <a href="#" className="text-fg-muted hover:text-fg transition-colors">
            Privacy
          </a>
          <a href="#" className="text-fg-muted hover:text-fg transition-colors">
            Terms
          </a>
          <a
            href="https://github.com/Gxnza48/Chain-work"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>
      </div>
      <div className="border-t-2 border-fg/40">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-fg-muted">
          © {new Date().getFullYear()} ChainWork. Built for small teams.
        </div>
      </div>
    </footer>
  );
}
