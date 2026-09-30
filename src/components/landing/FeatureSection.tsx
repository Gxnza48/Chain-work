import { MotionSurface } from "@/components/ui/Presence";
import {
  Check,
  FileText,
  Flag,
  Folder,
  MessageSquare,
  ArrowUpRight,
  GitBranch,
  ListTodo,
} from "lucide-react";
import { BentoGrid, type BentoLayout } from "@/components/ui/bento-grid";
import { AgentIcon } from "@/components/ui/AgentIcon";
import { Badge, Item, ItemContent, ItemTitle, Progress } from "@/components/cojeev";
import { useT } from "@/lib/i18n";

const layout: BentoLayout = {
  columns: 7,
  rows: 2,
  seed: 22,
  tiles: [
    { id: "tasks", label: "Tasks", x: 0, y: 0, width: 4, height: 1 },
    { id: "context", label: "Context", x: 4, y: 0, width: 3, height: 1 },
    { id: "projects", label: "Projects", x: 0, y: 1, width: 3, height: 1 },
    { id: "ai", label: "AI", x: 3, y: 1, width: 4, height: 1 },
  ],
};
const features = {
  tasks: {
    title: "Your next move, in focus.",
    copy: "One task list across your projects. Filter by owner, priority or project, and focus on the next move.",
    icon: ListTodo,
  },
  context: {
    title: "Keep the conversation close.",
    copy: "Chat, comments, files and ideas live beside the work. Your team always has the full picture.",
    icon: MessageSquare,
  },
  projects: {
    title: "Progress with a direction.",
    copy: "A milestone gives the work a destination. Your projects keep the route in view.",
    icon: Flag,
  },
  ai: {
    title: "Your AI joins the team.",
    copy: "Let your assistant work with the same projects, tasks, and context as everyone else.",
    icon: GitBranch,
  },
};

export function FeatureSection() {
  const t = useT();
  return (
    <MotionSurface reveal preset="rise" asChild>
    <section
      id="features"
      className="cw-container cw-section"
      aria-labelledby="features-title"
    >
      <div className="cw-section-header">
        <div>
          <p className="cw-eyebrow">02 / {t("Context, connected")}</p>
          <h2 id="features-title">
            {t("The work. The why.")}
            <br />
            <span>{t("All in the same place.")}</span>
          </h2>
        </div>
        <p className="cw-section-copy">
          {t(
            "Less time piecing things together. More time making something worth sharing.",
          )}
        </p>
      </div>
      <BentoGrid
        layout={layout}
        variant="classic"
        className="cw-features"
        renderTile={(tile) => {
          const key = tile.id as keyof typeof features;
          const feature = features[key];
          const Icon = feature.icon;
          return (
            <MotionSurface reveal preset="rise" asChild><article className="cw-feature">
              <div className="cw-feature-heading">
                <Icon size={19} aria-hidden="true" />
                <span>
                  {t(
                    key === "ai"
                      ? "Connected assistants"
                      : key === "tasks"
                        ? "Tasks"
                        : key === "context"
                          ? "Context"
                          : "Projects",
                  )}
                </span>
              </div>
              <div className="cw-feature-art" aria-hidden="true">
                {key === "tasks" && (
                  <div className="cw-mini-tasks">
                    {[
                      "Design the onboarding flow",
                      "Review the launch checklist",
                      "Ship the first release",
                    ].map((label, i) => (
                      <Item as="div" key={label}>
                        <span
                          className={
                            i === 2
                              ? "cw-task-circle is-done"
                              : "cw-task-circle"
                          }
                        >
                          {i === 2 && <Check size={12} />}
                        </span>
                        <ItemContent>
                          <ItemTitle>{t(label)}</ItemTitle>
                        </ItemContent>
                        <Badge>{t(i === 2 ? "Done" : "High")}</Badge>
                      </Item>
                    ))}
                  </div>
                )}
                {key === "context" && (
                  <div className="cw-mini-context">
                    <div>
                      <span className="cw-avatar">AC</span>
                      <span>
                        <strong>Agustín</strong>
                        <small>{t("Just now")}</small>
                      </span>
                    </div>
                    <p>
                      {t(
                        "The new flow is ready for review. Everything is in the project.",
                      )}
                    </p>
                    <Badge>
                      <FileText size={13} />
                      {t("Launch brief")}
                    </Badge>
                  </div>
                )}
                {key === "projects" && (
                  <div className="cw-mini-project">
                    <Folder size={22} />
                    <div>
                      <strong>{t("Website launch")}</strong>
                      <span>{t("Milestone · Launch")}</span>
                    </div>
                    <Progress value={75} />
                    <span className="cw-mini-progress">
                      {t("3 of 4 tasks complete")}
                    </span>
                  </div>
                )}
                {key === "ai" && (
                  <div className="cw-mini-ai">
                    <span className="cw-ai-node">
                      <AgentIcon agent="codex" />
                      <small>Codex</small>
                    </span>
                    <span className="cw-ai-line" />
                    <span className="cw-ai-center">
                      <GitBranch size={24} />
                      <small>ChainWork</small>
                    </span>
                    <span className="cw-ai-line" />
                    <span className="cw-ai-node">
                      <AgentIcon agent="claude" />
                      <small>Claude Code</small>
                    </span>
                  </div>
                )}
              </div>
              <h3>{t(feature.title)}</h3>
              <p>{t(feature.copy)}</p>
              {key === "ai" && (
                <a href="#developers" className="cw-inline-link">
                  {t("Explore the connection")}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              )}
            </article></MotionSurface>
          );
        }}
      />
    </section>
    </MotionSurface>
  );
}
