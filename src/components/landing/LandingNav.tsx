import { useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/cojeev";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore } from "@/store/theme";
import { useLangStore } from "@/store/lang";
import { useT } from "@/lib/i18n";

const links = [
  ["#how-it-works", "How it works"],
  ["#features", "Features"],
  ["#developers", "MCP & AI"],
  ["#faq", "FAQ"],
];

export function LandingNav() {
  const t = useT();
  const { user, loading } = useAuth();
  const { theme, toggle } = useThemeStore();
  const { lang, setLang } = useLangStore();
  const [open, setOpen] = useState(false);
  const themeLabel = t(theme === "dark" ? "Use light theme" : "Use dark theme");
  const languageLabel =
    lang === "es" ? "Switch to English" : "Cambiar a español";
  return (
    <header className="cw-nav">
      <div className="cw-container cw-nav-inner">
        <Logo size="md" />
        <nav className="cw-nav-links" aria-label={t("Primary navigation")}>
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {t(label)}
            </a>
          ))}
        </nav>
        <div className="cw-nav-tools">
          <Button
            variant="ghost"
            size="sm"
            className="cw-language"
            aria-label={languageLabel}
            title={languageLabel}
            onClick={() => setLang(lang === "es" ? "en" : "es")}
          >
            {lang.toUpperCase()}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={themeLabel}
            aria-label={themeLabel}
            onClick={toggle}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
          <div className="cw-nav-account" aria-busy={loading}>
            {loading ? (
              <span className="cw-nav-loading" />
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to={user ? "/dashboard" : "/auth?mode=login"}>
                  {t(user ? "Dashboard" : "Log in")}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button
                className="cw-menu-trigger"
                variant="ghost"
                size="icon"
                aria-label={t("Open menu")}
              >
                <Menu size={20} />
              </Button>
            </Dialog.Trigger>
            <Dialog.Overlay className="cw-menu-overlay" />
            <Dialog.Content className="cw-mobile-menu">
              <div className="cw-menu-heading">
                <Dialog.Title>{t("Navigation")}</Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("Close menu")}
                  >
                    <X size={20} />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                {t("Explore ChainWork and access your workspace.")}
              </Dialog.Description>
              <nav aria-label={t("Mobile navigation")}>
                {links.map(([href, label]) => (
                  <a key={href} href={href} onClick={() => setOpen(false)}>
                    {t(label)}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                ))}
              </nav>
              {!loading && (
                <Button asChild>
                  <Link
                    to={user ? "/dashboard" : "/auth?mode=register"}
                    onClick={() => setOpen(false)}
                  >
                    {t(user ? "Open dashboard" : "Start building free")}
                  </Link>
                </Button>
              )}
              {!user && !loading && (
                <Button asChild variant="ghost">
                  <Link to="/auth?mode=login" onClick={() => setOpen(false)}>
                    {t("Log in")}
                  </Link>
                </Button>
              )}
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
