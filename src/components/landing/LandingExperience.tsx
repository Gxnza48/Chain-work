import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Folder,
  GitBranch,
  Layers,
  ListTodo,
  MessageSquare,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { AgentIcon } from "@/components/ui/AgentIcon";
import { ProductPreview } from "./ProductPreview";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MotionPresence, MotionSurface } from "@/components/ui/Presence";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import { gsap, registerGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { BentoGrid } from "@/components/ui/bento-grid";
import { generateBento } from "@/lib/cojeev/bento-layout";

const workflow = [
  {
    icon: Layers,
    title: "Bring your people together.",
    body: "Create a chain, share its code, and give your team one place to build.",
  },
  {
    icon: Folder,
    title: "Give every idea a direction.",
    body: "Turn a goal into a project. Keep its tasks, milestones, ideas and files together.",
  },
  {
    icon: ListTodo,
    title: "Make the next step obvious.",
    body: "Set priorities, assign owners and see what needs your attention. Every finished task becomes progress.",
  },
];

export function LandingExperience() {
  const root = useRef<HTMLDivElement>(null);
  const t = useT();
  const { user } = useAuth();
  const [agent, setAgent] = useState<"codex" | "claude">("codex");
  const destination = user ? "/dashboard" : "/auth?mode=register";
  const featureLayout = generateBento(
    6,
    3,
    22,
    [
      { id: "tasks", label: "Tasks" },
      { id: "context", label: "Context" },
      { id: "projects", label: "Projects" },
      { id: "assistants", label: "Assistants" },
    ],
    "Dashboard",
  );
  useGSAP(
    () => {
      registerGsap();
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-enter", {
          y: 16,
          opacity: 0,
          stagger: 0.09,
          duration: 0.7,
          ease: "power2.out",
        });
        gsap.from(".preview-stage", {
          scale: 0.96,
          y: 32,
          scrollTrigger: {
            trigger: ".preview-stage",
            start: "top 95%",
            end: "top 45%",
            scrub: 1,
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            y: 22,
            opacity: 0.15,
            duration: 0.65,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          }),
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root}>
      <section className="landing-glow relative px-4 pb-20 pt-36 sm:px-6 sm:pt-44">
        <div className="mx-auto max-w-6xl text-center">
          <Link
            to="/changelog"
            className="hero-enter mb-7 inline-flex items-center gap-3 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            <span className="font-mono text-fg">ChainWork 2.0</span>
            <span className="h-3 w-px bg-border" />
            {t("A new space to build")}
            <ChevronRight className="h-3 w-3" />
          </Link>
          <h1 className="hero-enter mx-auto max-w-6xl text-balance font-display text-[clamp(2.35rem,6.5vw,5.5rem)] font-semibold leading-[1.06] tracking-[-.06em]">
            {t("Less noise.")}
            <br />
            <span className="text-fg-muted">
              {t("More work that matters.")}
            </span>
          </h1>
          <p className="hero-enter mx-auto mt-7 max-w-xl text-balance text-base leading-relaxed text-fg-muted sm:text-lg">
            {t(
              "Your people, projects and AI. Finally in the same flow. A focused workspace for teams that want to build.",
            )}
          </p>
          <div className="hero-enter mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={destination}>
                {t(user ? "Open dashboard" : "Start building free")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">
                {t("Explore the workspace")}
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="hero-enter mt-5 text-xs text-fg-muted">
            {t("Free during beta. Built for your whole team.")}
          </p>
        </div>
        <div className="preview-stage mx-auto mt-16 max-w-6xl sm:mt-20">
          <ProductPreview />
        </div>
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-fg-muted">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
            {t("Realtime, by default")}
          </span>
          <span className="flex items-center gap-2">
            <AgentIcon agent="codex" className="h-4 w-4" />
            Codex
          </span>
          <span className="flex items-center gap-2">
            <AgentIcon agent="claude" className="h-4 w-4" />
            Claude Code
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t("Your workspace. Your data.")}
          </span>
        </div>
      </section>

      <section
        id="how-it-works"
        className="landing-section scroll-mt-20 border-t border-border px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="max-w-3xl">
            <p className="mb-4 text-sm text-fg-muted">
              {t("A little structure. A lot of momentum.")}
            </p>
            <div
              role="heading"
              aria-level={2}
              className="max-w-3xl text-balance text-4xl font-medium leading-tight tracking-[-.045em] sm:text-5xl"
            >
              <ScrollReveal
                text={t("Everything connected. Nothing in your way.")}
                className="landing-reveal"
              />
            </div>
          </div>
          <div className="mt-14 grid grid-flow-dense gap-8 md:grid-cols-3">
            {workflow.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                data-reveal
                className="border-t border-border pt-6"
              >
                <Icon className="mb-7 h-5 w-5 text-fg-muted" />
                <h3 className="text-lg font-medium tracking-tight">
                  {t(title)}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-fg-muted">
                  {t(body)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="landing-section scroll-mt-20 border-t border-border bg-surface/40 px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div
            data-reveal
            className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
          >
            <h2 className="max-w-2xl text-balance text-4xl font-medium tracking-[-.045em] sm:text-5xl">
              {t("Built for the way")}
              <br />
              <span className="text-fg-muted">
                {t("work actually happens.")}
              </span>
            </h2>
            <p className="max-w-xs text-sm leading-7 text-fg-muted">
              {t(
                "From the first messy idea to the final release. Keep the context, skip the tab switching.",
              )}
            </p>
          </div>
          <BentoGrid
            layout={featureLayout}
            variant="classic"
            className="mt-4"
            aria-label={t("ChainWork workspace capabilities")}
            renderTile={(tile) => (
              <div className="flex h-full min-h-36 flex-col justify-between p-5 sm:p-7">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                    {tile.id === "tasks"
                      ? "01"
                      : tile.id === "context"
                        ? "02"
                        : tile.id === "projects"
                          ? "03"
                          : "04"}
                  </span>
                  <h3 className="mt-5 text-lg font-medium tracking-tight">
                    {t(
                      tile.id === "tasks"
                        ? "A clear view of what is next."
                        : tile.id === "context"
                          ? "The conversation stays close."
                          : tile.id === "projects"
                            ? "Every project has a direction."
                            : "Your AI, in the same flow.",
                    )}
                  </h3>
                </div>
                <p className="mt-4 max-w-sm text-sm leading-6 text-fg-muted">
                  {t(
                    tile.id === "tasks"
                      ? "One task list across your projects. Filter by owner, priority or project, and focus on the next move."
                      : tile.id === "context"
                        ? "Chat, comments, files and ideas live beside the work. Your team always has the full picture."
                        : tile.id === "projects"
                          ? "Keep milestones, ideas and files attached to the decisions that move work forward."
                          : "Connect Codex and Claude Code to your workspace without losing the human context.",
                  )}
                </p>
              </div>
            )}
          />
          <div className="sr-only">
            <article
              data-reveal
              className="group overflow-hidden rounded-xl border border-border bg-surface p-6 sm:p-8"
            >
              <ListTodo className="h-5 w-5 text-fg-muted" />
              <h3 className="mt-5 text-xl font-medium">
                {t("A clear view of what is next.")}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-fg-muted">
                {t(
                  "One task list across your projects. Filter by owner, priority or project, and focus on the next move.",
                )}
              </p>
              <div className="mt-8 space-y-2 transition-transform duration-500 group-hover:translate-x-1">
                {[
                  "Plan the next release",
                  "Review with the team",
                  "Ship something great",
                ].map((title, i) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-md border border-border bg-bg px-4 py-3 text-xs"
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-full border",
                        i === 2
                          ? "border-accent-emerald/30 text-accent-emerald"
                          : "border-fg-muted/40",
                      )}
                    >
                      {i === 2 && <Check className="h-2.5 w-2.5" />}
                    </span>
                    {t(title)}
                    <span className="ml-auto text-fg-muted">
                      {["01", "02", "03"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </article>
            <article
              data-reveal
              className="group overflow-hidden rounded-xl border border-border bg-surface p-6 sm:p-8"
            >
              <MessageSquare className="h-5 w-5 text-fg-muted" />
              <h3 className="mt-5 text-xl font-medium">
                {t("The conversation stays close.")}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-fg-muted">
                {t(
                  "Chat, comments, files and ideas live beside the work. Your team always has the full picture.",
                )}
              </p>
              <div className="mt-8 rounded-lg border border-border bg-bg p-5">
                <div className="mb-4 flex items-center gap-2 text-xs">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[9px]">
                    AG
                  </span>
                  Agustín
                  <span className="ml-auto text-[10px] text-fg-muted">
                    {t("Just now")}
                  </span>
                </div>
                <p className="text-sm text-fg-muted">
                  {t(
                    "The new flow is ready for review. Everything is in the project.",
                  )}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <Folder className="h-4 w-4" />
                  {t("Website launch")}
                  <ArrowRight className="ml-auto h-3 w-3 text-fg-muted transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="developers"
        className="landing-section scroll-mt-20 border-t border-border px-6"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div data-reveal>
            <div className="mb-7 flex items-center gap-5">
              <AgentIcon agent="codex" className="h-8 w-8" />
              <span className="text-fg-muted">+</span>
              <AgentIcon agent="claude" className="h-8 w-8" />
            </div>
            <h2 className="text-balance text-4xl font-medium tracking-[-.045em] sm:text-5xl">
              {t("Your AI,")}
              <br />
              <span className="text-fg-muted">{t("on the same page.")}</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-fg-muted">
              {t(
                "Connect Codex or Claude Code with MCP. Let your assistant find the next task, understand the project and report back when the work is done.",
              )}
            </p>
            <ul className="mt-7 space-y-3 text-sm text-fg-muted">
              {[
                "Projects, tasks and context in one connection",
                "Personal API keys you can revoke anytime",
                "Updates appear live for the whole team",
              ].map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-fg" />
                  {t(label)}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-8">
              <Link
                to={user ? "/settings#integrations" : "/auth?mode=register"}
              >
                {t("Connect your assistant")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div
            data-reveal
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div
              className="flex items-center gap-1 border-b border-border p-3"
              role="group"
              aria-label={t("Choose your assistant")}
            >
              {(["codex", "claude"] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={agent === value}
                  onClick={() => setAgent(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors",
                    agent === value
                      ? "bg-surface-2 text-fg"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  <AgentIcon agent={value} className="h-4 w-4" />
                  {value === "codex" ? "Codex" : "Claude Code"}
                </button>
              ))}
              <Terminal className="ml-auto mr-2 h-4 w-4 text-fg-muted" />
            </div>
            <div className="p-5 font-mono text-xs leading-7 sm:p-7">
              <p className="mb-5 text-fg-muted">
                {agent === "codex" ? "$ codex" : "$ claude"}
              </p>
              <p className="flex items-start gap-3">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0" />
                {t("Find the next task in my chain and help me ship it.")}
              </p>
              <MotionPresence mode="wait">
                <MotionSurface
                  key={agent}
                  preset="fade"
                  className="mt-7 space-y-4"
                >
                  <p className="flex items-center gap-3 text-fg-muted">
                    <Check className="h-3.5 w-3.5 text-accent-emerald" />
                    chainwork.list_projects
                  </p>
                  <p className="flex items-center gap-3 text-fg-muted">
                    <Check className="h-3.5 w-3.5 text-accent-emerald" />
                    chainwork.get_next_task
                  </p>
                  <div className="rounded-md border border-border bg-bg p-4">
                    <p className="mb-1 text-fg">
                      {t("Build the onboarding flow")}
                    </p>
                    <p className="text-fg-muted">
                      {t("Project context loaded. Ready to start.")}
                    </p>
                  </div>
                  <p className="flex items-center gap-3 text-fg-muted">
                    <Code2 className="h-3.5 w-3.5" />
                    {t("Your assistant writes and tests the code.")}
                  </p>
                  <p className="flex items-center gap-3 text-fg-muted">
                    <GitBranch className="h-3.5 w-3.5" />
                    {t("The result goes back to your team.")}
                  </p>
                </MotionSurface>
              </MotionPresence>
              <p className="mt-6 border-t border-border pt-4 text-[10px] text-fg-muted">
                {t(
                  "Example workflow · Your assistant asks before taking action.",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="landing-section scroll-mt-20 border-t border-border px-6"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.5fr]">
          <h2 data-reveal className="text-3xl font-medium tracking-tight">
            {t("A few things to know.")}
          </h2>
          <Accordion type="single" collapsible>
            {[
              [
                "What is a chain?",
                "A chain is your shared workspace. Invite your team with a code, then organize projects, tasks, ideas and conversations in one place.",
              ],
              [
                "Is ChainWork free?",
                "ChainWork is free during beta. Create an account and start working with your team.",
              ],
              [
                "Can I use Codex and Claude Code?",
                "Yes. Generate a personal API key in Settings, choose your assistant, and follow the connection instructions. Both use the same MCP server.",
              ],
              [
                "What happens to my existing work?",
                "Everything stays in place. ChainWork 2.0 uses the same accounts, chains, projects and task history. Just sign in as usual.",
              ],
              [
                "Can I use it on my phone?",
                "Yes. ChainWork adapts to your screen and can be installed as a web app for quick access.",
              ],
            ].map(([q, a]) => (
              <AccordionItem value={q} key={q}>
                <AccordionTrigger className="text-left font-medium">
                  {t(q)}
                </AccordionTrigger>
                <AccordionContent className="leading-7 text-fg-muted">
                  {t(a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <section className="landing-glow landing-section border-t border-border px-6 text-center">
        <h2 className="text-balance text-4xl font-medium tracking-[-.045em] sm:text-6xl">
          {t("Make room for great work.")}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-fg-muted">
          {t("Start a chain. Bring your team. Build what is next.")}
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to={destination}>
            {t(user ? "Open dashboard" : "Start building free")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
