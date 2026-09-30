import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";
import { LandingExperience } from "@/components/landing/LandingExperience";
import { useT } from "@/lib/i18n";
import { initLenis, destroyLenis } from "@/lib/lenis";

export default function Landing() {
  const t = useT();
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      initLenis();
    return () => {
      destroyLenis();
    };
  }, []);

  return (
    <div className="dark min-h-screen bg-bg text-fg">
      <a href="#main" className="skip-link">
        {t("Skip to content")}
      </a>
      <Navbar />
      <main id="main" className="w-full max-w-full overflow-x-hidden">
        <LandingExperience />
      </main>
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="flex gap-6 text-xs text-fg-muted">
            <Link to="/changelog" className="hover:text-fg">
              {t("Changelog")}
            </Link>
            <a
              href="https://github.com/Gxnza48/Chain-work"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg"
            >
              GitHub
            </a>
            <a href="#developers" className="hover:text-fg">
              MCP
            </a>
          </div>
          <p className="text-xs text-fg-muted">
            {t("Made in Argentina by Gonzalo Bonadeo & Agustin Casal")}
          </p>
        </div>
      </footer>
    </div>
  );
}
