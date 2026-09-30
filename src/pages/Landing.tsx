import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LandingExperience } from "@/components/landing/LandingExperience";
import { LandingNav } from "@/components/landing/LandingNav";
import { useT } from "@/lib/i18n";
import { useThemeStore } from "@/store/theme";
import "@/components/landing/landing.css";

export default function Landing() {
  const t = useT();
  const theme = useThemeStore((s) => s.theme);
  return (
    <div className={`cw-landing ${theme}`}>
      <a href="#main" className="skip-link">
        {t("Skip to content")}
      </a>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <LandingExperience />
      </main>
      <footer className="cw-footer cw-container">
        <div className="cw-footer-top">
          <div>
            <Logo size="md" />
            <p>{t("A shared space for what comes next.")}</p>
          </div>
          <nav aria-label={t("Footer navigation")}>
            <a href="#features">{t("Product")}</a>
            <a href="#developers">
              MCP
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <Link to="/changelog">{t("Changelog")}</Link>
            <a
              href="https://github.com/Gxnza48/Chain-work"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </nav>
        </div>
        <div className="cw-footer-bottom">
          <span>© {new Date().getFullYear()} ChainWork</span>
          <span>
            {t("Made in Argentina by Gonzalo Bonadeo & Agustin Casal")}
          </span>
          <a href="#main">{t("Back to top")} ↑</a>
        </div>
      </footer>
    </div>
  );
}
