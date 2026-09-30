import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLangStore } from "@/store/lang";
import { useT } from "@/lib/i18n";
import { releases } from "@/lib/releases";
import { useAuth } from "@/hooks/useAuth";

export default function Changelog() {
  const lang = useLangStore((s) => s.lang);
  const t = useT();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <LanguageToggle />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
        <Link
          to={user ? "/dashboard" : "/"}
          className="mb-10 inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(user ? "Your chains" : "Home")}
        </Link>
        <h1 className="text-4xl font-medium tracking-tight">
          {t("Changelog")}
        </h1>
        <p className="mt-4 text-fg-muted">
          {lang === "es"
            ? "Lo que cambia. Lo que mejora. Lo que viene."
            : "What changes. What improves. What is next."}
        </p>
        <div className="mt-14 space-y-14">
          {releases.map((release) => (
            <article
              key={release.version}
              className="border-t border-border pt-8"
            >
              <div className="flex gap-3 text-xs text-fg-muted">
                <span className="rounded border border-border bg-surface px-2 py-1 font-mono text-fg">
                  v{release.version}
                </span>
                <time dateTime={release.date} className="py-1">
                  {new Date(`${release.date}T12:00:00Z`).toLocaleDateString(
                    lang,
                    { dateStyle: "long" },
                  )}
                </time>
              </div>
              <h2 className="mt-6 text-2xl font-medium tracking-tight">
                {release.title[lang]}
              </h2>
              <p className="mt-3 text-sm leading-7 text-fg-muted">
                {release.summary[lang]}
              </p>
              <ul className="mt-6 list-disc space-y-4 pl-5 text-sm leading-7 text-fg-muted">
                {release.changes.map((change) => (
                  <li key={change.en}>{change[lang]}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <a
          className="mt-12 inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg"
          href="https://github.com/Gxnza48/Chain-work/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noreferrer"
        >
          {lang === "es"
            ? "Ver detalles técnicos"
            : "View technical release notes"}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </main>
    </div>
  );
}
