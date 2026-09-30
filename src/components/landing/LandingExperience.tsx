import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Check, ChevronRight } from "lucide-react";
import { MotionSurface } from "@/components/ui/Presence";
import { AgentIcon } from "@/components/ui/AgentIcon";
import {
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./cojeev";
import { ProductPreview } from "./ProductPreview";
import { WorkflowSection } from "./WorkflowSection";
import { FeatureSection } from "./FeatureSection";
import { McpShowcase } from "./McpShowcase";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";

const questions = [
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
];

export function LandingExperience() {
  const t = useT();
  const { user } = useAuth();
  const destination = user ? "/dashboard" : "/auth?mode=register";
  return (
    <>
      <section className="cw-hero cw-container" aria-labelledby="landing-title">
        <MotionSurface preset="rise" className="cw-hero-copy">
          <Link to="/changelog" className="cw-release-link">
            <span className="cw-dot" />
            {t("ChainWork 2.0 · A new space to build")}
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
          <div className="cw-hero-grid">
            <h1 id="landing-title">
              {t("One place.")}
              <br />
              <span>{t("Your whole team.")}</span>
            </h1>
            <div className="cw-hero-aside">
              <p>
                {t(
                  "Projects, people, and your AI. Connected, so you can get back to building.",
                )}
              </p>
              <div className="cw-actions">
                <Button asChild size="lg">
                  <Link to={destination}>
                    {t(user ? "Open dashboard" : "Start building free")}
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href="#workspace-preview">
                    {t("Take a look inside")}
                    <ArrowDown size={15} aria-hidden="true" />
                  </a>
                </Button>
              </div>
              <span className="cw-hero-note">
                {t("Free during beta. Made for working together.")}
              </span>
            </div>
          </div>
        </MotionSurface>
        <MotionSurface
          preset="rise"
          delay={0.12}
          className="cw-hero-preview"
          id="workspace-preview"
        >
          <ProductPreview />
        </MotionSurface>
        <div className="cw-trust-strip">
          <span>
            <Check size={14} aria-hidden="true" />
            {t("Realtime, by default")}
          </span>
          <span>
            <Check size={14} aria-hidden="true" />
            {t("Your workspace. Your data.")}
          </span>
          <a href="#developers">
            <span className="cw-agent-pair">
              <AgentIcon agent="codex" />
              <AgentIcon agent="claude" />
            </span>
            {t("Works with Codex & Claude Code")}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>
      </section>
      <WorkflowSection />
      <FeatureSection />
      <McpShowcase />
      <section
        id="faq"
        className="cw-section cw-container cw-faq"
        aria-labelledby="faq-title"
      >
        <div>
          <p className="cw-eyebrow">04 / {t("Good to know")}</p>
          <h2 id="faq-title">{t("A few things to know.")}</h2>
          <p className="cw-section-copy">
            {t("Less guessing. More getting started.")}
          </p>
        </div>
        <Accordion type="single" collapsible className="cw-faq-list">
          {questions.map(([question, answer], i) => (
            <AccordionItem key={question} value={String(i)}>
              <AccordionTrigger>{t(question)}</AccordionTrigger>
              <AccordionContent>{t(answer)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <section
        className="cw-container cw-closing"
        aria-labelledby="closing-title"
      >
        <div>
          <p className="cw-eyebrow">{t("The next thing starts here")}</p>
          <h2 id="closing-title">{t("Make room for great work.")}</h2>
          <p>{t("Start a chain. Bring your team. Build what is next.")}</p>
        </div>
        <Button asChild size="lg">
          <Link to={destination}>
            {t(user ? "Open dashboard" : "Start building free")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </>
  );
}
