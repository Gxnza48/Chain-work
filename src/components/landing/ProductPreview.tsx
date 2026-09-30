import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  FileText,
  Flag,
  Folder,
  Layers,
  ListTodo,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ChainMark } from "@/components/layout/Logo";
import { MotionPresence, MotionSurface } from "@/components/ui/Presence";
import { AgentState } from "@/components/ui/agent-state";
import {
  Badge,
  Button,
  Card,
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/landing/cojeev";
import "./product-preview.css";

const tasks = [
  {
    id: "onboarding",
    title: "Design the onboarding flow",
    project: "Website",
    person: "AG",
    priority: "High",
  },
  {
    id: "auth",
    title: "Connect the authentication",
    project: "Platform",
    person: "GB",
    priority: "High",
  },
  {
    id: "review",
    title: "Review the launch checklist",
    project: "Website",
    person: "MR",
    priority: "Medium",
  },
  {
    id: "release",
    title: "Ship the first release",
    project: "Platform",
    person: "TC",
    priority: "Medium",
  },
] as const;

const projects = [
  {
    name: "Website",
    description: "A clear first impression, from first click to first chain.",
    icon: Layers,
  },
  {
    name: "Platform",
    description: "The shared foundation for every next step.",
    icon: Folder,
  },
] as const;

/** This interactive sample owns only local state; it never reads or writes account data. */
export function ProductPreview() {
  const t = useT();
  const [view, setView] = useState("tasks");
  const [completed, setCompleted] = useState<string[]>(["release"]);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const progress = (completed.length / tasks.length) * 100;
  const visibleTasks = tasks.filter(
    (task) => !projectFilter || task.project === projectFilter,
  );

  function showProject(name: string) {
    setProjectFilter(name);
    setView("tasks");
  }

  return (
    <div className="cw-preview" aria-label={t("Interactive ChainWork preview")}>
      <header className="cw-preview__bar">
        <div className="cw-preview__brand">
          <ChainMark aria-hidden="true" className="cw-preview__brand-mark" />
          <span>ChainWork</span>
          <span className="cw-preview__bar-divider" aria-hidden="true" />
          <span className="cw-preview__studio">Studio</span>
        </div>
        <Badge className="cw-preview__sample" size="sm">
          {t("Interactive preview")}
        </Badge>
      </header>

      <div className="cw-preview__workspace">
        <aside
          className="cw-preview__sidebar"
          aria-label={t("Sample chain overview")}
        >
          <span className="cw-preview__eyebrow">{t("Your chain")}</span>
          <div className="cw-preview__chain">
            <span className="cw-preview__chain-icon">
              <Layers size={18} aria-hidden="true" />
            </span>
            <strong>Studio</strong>
            <span>{t("One team. A clear next step.")}</span>
          </div>
          <span className="cw-preview__eyebrow">{t("Shared context")}</span>
          <ul className="cw-preview__context-index">
            <li>
              <Folder size={15} aria-hidden="true" />
              <span>{t("Projects")}</span>
              <span>02</span>
            </li>
            <li>
              <Flag size={15} aria-hidden="true" />
              <span>{t("Milestone")}</span>
              <span>01</span>
            </li>
            <li>
              <FileText size={15} aria-hidden="true" />
              <span>{t("Project brief")}</span>
              <span>01</span>
            </li>
          </ul>
          <div className="cw-preview__team">
            <div className="cw-preview__avatars" aria-hidden="true">
              <span>AG</span>
              <span>GB</span>
              <span>MR</span>
              <span>TC</span>
            </div>
            <span>{t("Four people. One direction.")}</span>
          </div>
        </aside>

        <div className="cw-preview__main">
          <div className="cw-preview__heading">
            <div>
              <span className="cw-preview__eyebrow">{t("Product launch")}</span>
              <h3>{t("Make the next step count.")}</h3>
            </div>
            <Badge className="cw-preview__release-badge" size="sm">
              {t("Next release")}
            </Badge>
          </div>

          <Tabs
            value={view}
            onValueChange={setView}
            variant="underline"
            className="cw-preview__tabs"
          >
            <TabsList
              aria-label={t("Explore the sample workspace")}
              className="cw-preview__tab-list"
            >
              <TabsTrigger value="tasks">
                <ListTodo size={15} aria-hidden="true" />
                {t("Tasks")}
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Folder size={15} aria-hidden="true" />
                {t("Projects")}
              </TabsTrigger>
              <TabsTrigger value="context">
                <MessageSquare size={15} aria-hidden="true" />
                {t("Context")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="cw-preview__panel">
              <div className="cw-preview__list-heading">
                <span>{projectFilter ? t(projectFilter) : t("This week")}</span>
                {projectFilter ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProjectFilter(null)}
                  >
                    {t("Show all tasks")}
                  </Button>
                ) : (
                  <span>{t("{count} tasks", { count: tasks.length })}</span>
                )}
              </div>
              <div className="cw-preview__task-list">
                {visibleTasks.map((task) => {
                  const done = completed.includes(task.id);
                  return (
                    <Item
                      key={task.id}
                      className={cn(
                        "cw-preview__task",
                        done && "cw-preview__task--done",
                      )}
                      aria-pressed={done}
                      aria-label={t(
                        done ? "Reopen {title}" : "Complete {title}",
                        { title: t(task.title) },
                      )}
                      onClick={() =>
                        setCompleted((current) =>
                          done
                            ? current.filter((id) => id !== task.id)
                            : [...current, task.id],
                        )
                      }
                    >
                      <span className="cw-preview__check" aria-hidden="true">
                        {done ? <Check size={14} /> : <Circle size={18} />}
                      </span>
                      <ItemContent
                        as="span"
                        className="cw-preview__task-content"
                      >
                        <ItemTitle as="span" className="cw-preview__task-title">
                          {t(task.title)}
                        </ItemTitle>
                        <ItemDescription
                          as="span"
                          className="cw-preview__task-project"
                        >
                          {t(task.project)}
                        </ItemDescription>
                      </ItemContent>
                      <Badge className="cw-preview__priority" size="sm">
                        {t(done ? "Done" : task.priority)}
                      </Badge>
                      <span className="cw-preview__assignee" aria-hidden="true">
                        {task.person}
                      </span>
                    </Item>
                  );
                })}
              </div>
              <p className="cw-preview__hint">
                <CheckCheck size={14} aria-hidden="true" />
                {t("Check off a task. Watch the milestone move.")}
              </p>
            </TabsContent>

            <TabsContent value="projects" className="cw-preview__panel">
              <div className="cw-preview__project-grid">
                {projects.map(({ name, description, icon: Icon }) => {
                  const projectTasks = tasks.filter(
                    (task) => task.project === name,
                  );
                  const doneCount = projectTasks.filter((task) =>
                    completed.includes(task.id),
                  ).length;
                  return (
                    <Card key={name} className="cw-preview__project">
                      <div className="cw-preview__project-top">
                        <Icon size={21} aria-hidden="true" />
                        <Badge size="sm">
                          {t("{count} tasks", { count: projectTasks.length })}
                        </Badge>
                      </div>
                      <h4>{t(name)}</h4>
                      <p>{t(description)}</p>
                      <Progress
                        value={doneCount}
                        max={projectTasks.length}
                        appearance="line"
                        size="sm"
                        aria-label={t("{project} progress", {
                          project: t(name),
                        })}
                        className="cw-preview__project-progress"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showProject(name)}
                        className="cw-preview__project-action"
                      >
                        {t("View tasks")}
                        <ArrowRight size={15} aria-hidden="true" />
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="context" className="cw-preview__panel">
              <div className="cw-preview__context-grid">
                <Card className="cw-preview__conversation">
                  <div className="cw-preview__note-heading">
                    <span className="cw-preview__assignee" aria-hidden="true">
                      AG
                    </span>
                    <strong>Ana</strong>
                    <span>{t("In the project")}</span>
                  </div>
                  <p>
                    {t(
                      "Onboarding is ready for review. The brief and decisions are here, so we can pick up where we left off.",
                    )}
                  </p>
                  <Button
                    className="cw-preview__file"
                    variant="outline"
                    size="sm"
                    aria-expanded={briefOpen}
                    aria-controls="preview-project-brief"
                    onClick={() => setBriefOpen((open) => !open)}
                  >
                    <FileText size={16} aria-hidden="true" />
                    <span>launch-brief.md</span>
                    <ChevronRight
                      className={
                        briefOpen ? "cw-preview__chevron--open" : undefined
                      }
                      size={14}
                      aria-hidden="true"
                    />
                  </Button>
                  <MotionPresence initial={false}>
                    {briefOpen && (
                      <MotionSurface
                        key="brief"
                        preset="fade"
                        id="preview-project-brief"
                        className="cw-preview__brief"
                      >
                        {t(
                          "Goal: help a new teammate join a chain and find their first task in one clear flow.",
                        )}
                      </MotionSurface>
                    )}
                  </MotionPresence>
                </Card>
                <div className="cw-preview__assistant-context">
                  <AgentState
                    status="complete"
                    size="sm"
                    label={t("Context, ready to share.")}
                    description={t(
                      "Tasks, decisions and the project brief stay together.",
                    )}
                  />
                  <span className="cw-preview__assistant-label">
                    {t("For your team. And your AI.")}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="cw-preview__milestone">
            <div className="cw-preview__milestone-copy">
              <Flag size={15} aria-hidden="true" />
              <span>{t("Launch milestone")}</span>
              <strong>{progress}%</strong>
            </div>
            <Progress
              value={completed.length}
              max={tasks.length}
              appearance="line"
              size="sm"
              aria-label={t("Launch milestone progress")}
              className="cw-preview__milestone-progress"
            />
            <span className="cw-preview__progress-summary" role="status">
              {t("{done} of {total} tasks complete", {
                done: completed.length,
                total: tasks.length,
              })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="cw-preview__reset"
              onClick={() => {
                setCompleted(["release"]);
                setProjectFilter(null);
                setBriefOpen(false);
                setView("tasks");
              }}
              aria-label={t("Reset preview")}
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>{t("Reset")}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
