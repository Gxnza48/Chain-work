import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  FolderOpen,
  KeyRound,
  MessageSquare,
  Terminal,
} from "lucide-react";
import { AgentIcon } from "@/components/ui/AgentIcon";
import { AgentState } from "@/components/ui/agent-state";
import { MotionPresence, MotionSurface } from "@/components/ui/Presence";
import { useChoreography } from "@/lib/cojeev-motion/choreography";
import { Badge, Button, Card } from "@/components/cojeev";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import "./mcp-showcase.css";

type Assistant = "codex" | "claude";

const steps = [
  {
    label: "Connect",
    title: "Your workspace, within reach.",
    description:
      "Create a personal API key in Settings, then add ChainWork to your assistant.",
    prompt: "Connect to ChainWork and show my workspaces.",
    state: "Ready to connect",
    tools: ["whoami", "list_chains"],
  },
  {
    label: "Context",
    title: "Start with the full picture.",
    description:
      "Read the project, its milestones and the people behind the work before making a change.",
    prompt: "Read the website project and its milestones.",
    state: "Project context in view",
    tools: ["get_project", "list_milestones"],
  },
  {
    label: "Next task",
    title: "Know exactly where to begin.",
    description:
      "Find the next task, read its details and catch up on the conversation.",
    prompt: "Find our next task and read the discussion.",
    state: "The next task is clear",
    tools: ["get_next_task", "list_comments"],
  },
  {
    label: "Progress",
    title: "Close the loop with your team.",
    description:
      "Share a progress note. When the work is verified, mark the task complete with a result your team can review.",
    prompt: "Share the result and complete the verified task.",
    state: "A result the team can review",
    tools: ["add_comment", "complete_task"],
  },
] as const;

/** An entirely local, user-controlled example; no MCP calls or account writes. */
export function McpShowcase() {
  const { quiet } = useChoreography();
  const t = useT();
  const { user } = useAuth();
  const [assistant, setAssistant] = useState<Assistant>("codex");
  const [step, setStep] = useState(0);
  const active = steps[step];
  const assistantName = assistant === "codex" ? "Codex" : "Claude Code";

  return (
    <MotionSurface reveal preset="rise" asChild>
    <section
      id="developers"
      className="cw-mcp"
      aria-labelledby="cw-mcp-heading"
    >
      <div className="cw-container cw-mcp__layout">
        <div className="cw-mcp__intro">
          <p className="cw-mcp__eyebrow">{t("MCP · A shared context")}</p>
          <h2 id="cw-mcp-heading">
            {t("Your AI.")}
            <br />
            <span>{t("Your team's context.")}</span>
          </h2>
          <p className="cw-mcp__lead">
            {t(
              "Bring Codex or Claude Code into the work. Projects, tasks and conversations give your assistant a place to start. Your team stays in the loop.",
            )}
          </p>

          <div className="cw-mcp__capabilities">
            <div>
              <FolderOpen aria-hidden="true" />
              <p>
                <strong>{t("Read the room.")}</strong>
                <span>
                  {t("Projects, milestones, members and task discussions.")}
                </span>
              </p>
            </div>
            <div>
              <MessageSquare aria-hidden="true" />
              <p>
                <strong>{t("Keep the work connected.")}</strong>
                <span>
                  {t("Update tasks and leave a clear record of progress.")}
                </span>
              </p>
            </div>
            <div>
              <KeyRound aria-hidden="true" />
              <p>
                <strong>{t("Keep control of access.")}</strong>
                <span>
                  {t("Personal API keys. Revoke them whenever you need.")}
                </span>
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="cw-mcp__connect">
            <Link to={user ? "/settings#integrations" : "/auth?mode=register"}>
              {t("Connect your assistant")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="cw-mcp__compatibility">
            <AgentIcon agent="codex" />
            <span>Codex</span>
            <span aria-hidden="true">/</span>
            <AgentIcon agent="claude" />
            <span>Claude Code</span>
          </p>
        </div>

        <Card className="cw-mcp__preview">
          <div className="cw-mcp__toolbar">
            <div
              className="cw-mcp__clients"
              role="group"
              aria-label={t("Choose your assistant")}
            >
              {(["codex", "claude"] as const).map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-pressed={assistant === value}
                  onClick={() => setAssistant(value)}
                  className="cw-mcp__client"
                >
                  <AgentIcon agent={value} />
                  {value === "codex" ? "Codex" : "Claude Code"}
                </Button>
              ))}
            </div>
            <Badge variant="dashed" className="cw-mcp__preview-badge">
              {t("Interactive preview")}
            </Badge>
          </div>

          <div
            className="cw-mcp__steps"
            role="group"
            aria-label={t("Explore the MCP workflow")}
          >
            {steps.map((item, index) => (
              <Button
                key={item.label}
                type="button"
                variant="ghost"
                shape="card"
                aria-pressed={step === index}
                onClick={() => setStep(index)}
                className="cw-mcp__step"
              >
                <span className="cw-mcp__step-number" aria-hidden="true">
                  {index < step ? <Check /> : `0${index + 1}`}
                </span>
                <span>{t(item.label)}</span>
              </Button>
            ))}
          </div>

          <div className="cw-mcp__stage">
            <MotionPresence mode={quiet ? "sync" : "wait"}>
              <MotionSurface
                key={`${assistant}-${step}`}
                preset="fade"
                className="cw-mcp__scene"
              >
                <div className="cw-mcp__scene-heading">
                  <span className="cw-mcp__terminal-label">
                    <Terminal aria-hidden="true" />
                    {assistantName}
                    <ChevronRight aria-hidden="true" />
                    ChainWork
                  </span>
                  <h3>{t(active.title)}</h3>
                  <p>{t(active.description)}</p>
                </div>
                <div className="cw-mcp__prompt">
                  <span aria-hidden="true">&gt;</span>
                  <p>{t(active.prompt)}</p>
                </div>
                <div
                  className="cw-mcp__tool-list"
                  aria-label={t("Tools used in this example")}
                >
                  {active.tools.map((tool) => (
                    <div key={tool}>
                      <Check aria-hidden="true" />
                      <code>
                        <span>chainwork.</span>
                        {tool}
                      </code>
                      <span className="cw-mcp__tool-label">MCP</span>
                    </div>
                  ))}
                </div>

                <div className="cw-mcp__result">
                  {step === 0 && (
                    <>
                      <span className="cw-mcp__result-kicker">
                        {t("Example workspace")}
                      </span>
                      <div className="cw-mcp__result-title">
                        <span className="cw-mcp__chain-mark" aria-hidden="true">
                          C
                        </span>
                        <div>
                          <strong>{t("Studio chain")}</strong>
                          <p>{t("One shared workspace. Both assistants.")}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <span className="cw-mcp__result-kicker">
                        {t("Project context")}
                      </span>
                      <div className="cw-mcp__result-title">
                        <FolderOpen aria-hidden="true" />
                        <div>
                          <strong>{t("Website launch")}</strong>
                          <p>{t("Milestone: a better first experience")}</p>
                        </div>
                      </div>
                      <div className="cw-mcp__context-tags">
                        <Badge variant="dashed">{t("Project brief")}</Badge>
                        <Badge variant="dashed">{t("Repository links")}</Badge>
                        <Badge variant="dashed">{t("Milestones")}</Badge>
                      </div>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <span className="cw-mcp__result-kicker">
                        {t("Next task · Website launch")}
                      </span>
                      <div className="cw-mcp__result-title">
                        <span
                          className="cw-mcp__task-mark"
                          aria-hidden="true"
                        />
                        <div>
                          <strong>{t("Build the onboarding flow")}</strong>
                          <p>
                            {t(
                              "Read the requirements. Check the discussion. Start with context.",
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant="dashed">{t("Pending")}</Badge>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <span className="cw-mcp__result-kicker">
                        {t("Example team update")}
                      </span>
                      <div className="cw-mcp__result-title">
                        <CheckCheck aria-hidden="true" />
                        <div>
                          <strong>{t("Onboarding flow completed")}</strong>
                          <p>
                            {t(
                              "Implementation verified. Review notes added to the task.",
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant="dashed">{t("Ready for your team")}</Badge>
                    </>
                  )}
                </div>
                <AgentState
                  status={step === 0 ? "idle" : "complete"}
                  size="sm"
                  label={t(active.state)}
                  className="cw-mcp__agent-state"
                  aria-live="off"
                />
              </MotionSurface>
            </MotionPresence>
          </div>

          <div className="cw-mcp__preview-footer">
            <p>{t("Example only. Your workspace stays untouched.")}</p>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setStep((current) => (current + 1) % steps.length)}
              className="cw-mcp__next"
            >
              {t(step === steps.length - 1 ? "Replay preview" : "Next step")}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {t("Preview step {step} of {total}", {
              step: step + 1,
              total: steps.length,
            })}
            : {t(active.title)} · {assistantName}
          </span>
        </Card>
      </div>
    </section>
    </MotionSurface>
  );
}
