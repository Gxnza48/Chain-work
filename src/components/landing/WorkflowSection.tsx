import { useState } from "react";
import {
  Check,
  ChevronRight,
  Folder,
  Layers,
  ListTodo,
  Users,
} from "lucide-react";
import { MotionPresence, MotionSurface } from "@/components/ui/Presence";
import {
  Card,
  Badge,
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./cojeev";
import { useT } from "@/lib/i18n";

const steps = [
  {
    id: "team",
    title: "Bring your people together.",
    body: "Create a chain, share its code, and give your team one place to build.",
    icon: Users,
  },
  {
    id: "project",
    title: "Give every idea a direction.",
    body: "Turn a goal into a project. Keep its tasks, milestones, ideas and files together.",
    icon: Folder,
  },
  {
    id: "task",
    title: "Make the next step obvious.",
    body: "Set priorities, assign owners and see what needs your attention. Every finished task becomes progress.",
    icon: ListTodo,
  },
];

export function WorkflowSection() {
  const t = useT();
  const [step, setStep] = useState("team");
  return (
    <section
      id="how-it-works"
      className="cw-container cw-section"
      aria-labelledby="workflow-title"
    >
      <div className="cw-section-header">
        <div>
          <p className="cw-eyebrow">01 / {t("A shared starting point")}</p>
          <h2 id="workflow-title">
            {t("A little structure.")}
            <br />
            <span>{t("A lot of momentum.")}</span>
          </h2>
        </div>
        <p className="cw-section-copy">
          {t(
            "From your first idea to the final checkmark. There is a place for every step.",
          )}
        </p>
      </div>
      <Tabs value={step} onValueChange={setStep} className="cw-workflow">
        <TabsList
          className="cw-workflow-steps"
          aria-label={t("Explore the workflow")}
        >
          {steps.map(({ id, title, body }, i) => (
            <TabsTrigger key={id} value={id} className="cw-workflow-step">
              <span className="cw-step-number">0{i + 1}</span>
              <span>
                <strong>{t(title)}</strong>
                <span className="cw-step-body">{t(body)}</span>
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="cw-workflow-display">
          <div className="cw-workflow-breadcrumb">
            <Layers size={15} aria-hidden="true" />
            {t("Chain")}
            <ChevronRight size={12} />
            <span>{t("Project")}</span>
            <ChevronRight size={12} />
            <span>{t("Task")}</span>
          </div>
          {steps.map(({ id, icon: Icon }) => (
            <TabsContent key={id} value={id} className="cw-workflow-panel">
              <MotionPresence mode="wait">
                <MotionSurface key={step} preset="rise">
                  <Card className="cw-workflow-card">
                    <div className="cw-workflow-card-top">
                      <span className="cw-icon-box">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <Badge>
                        {t(
                          id === "team"
                            ? "Shared workspace"
                            : id === "project"
                              ? "In progress"
                              : "Ready to start",
                        )}
                      </Badge>
                    </div>
                    <h3>
                      {t(
                        id === "team"
                          ? "Your people. One chain."
                          : id === "project"
                            ? "Website launch"
                            : "Design the onboarding flow",
                      )}
                    </h3>
                    <p>
                      {t(
                        id === "team"
                          ? "A shared home for the people you build with."
                          : id === "project"
                            ? "The brief, the files, and the next milestone. Together."
                            : "A clear owner, a priority, and the context to get going.",
                      )}
                    </p>
                    <div className="cw-workflow-items">
                      <Item as="div">
                        <span className="cw-avatar">
                          {id === "team" ? "GB" : "01"}
                        </span>
                        <ItemContent>
                          <ItemTitle>
                            {t(
                              id === "team"
                                ? "Gonzalo · Owner"
                                : id === "project"
                                  ? "Plan the next release"
                                  : "Agustín · Assigned",
                            )}
                          </ItemTitle>
                          <ItemDescription>
                            {t(
                              id === "team"
                                ? "Creates the chain and invites the team"
                                : id === "project"
                                  ? "Milestone · Launch"
                                  : "Priority · High",
                            )}
                          </ItemDescription>
                        </ItemContent>
                        <Check size={15} aria-hidden="true" />
                      </Item>
                      <Item as="div">
                        <span className="cw-avatar">
                          {id === "team" ? "AC" : "02"}
                        </span>
                        <ItemContent>
                          <ItemTitle>
                            {t(
                              id === "team"
                                ? "Agustín · Member"
                                : id === "project"
                                  ? "Review with the team"
                                  : "Keep the conversation here",
                            )}
                          </ItemTitle>
                          <ItemDescription>
                            {t(
                              id === "team"
                                ? "Joins with the invitation code"
                                : id === "project"
                                  ? "Tasks, ideas, and feedback"
                                  : "Comments and files stay with the task",
                            )}
                          </ItemDescription>
                        </ItemContent>
                        <Check size={15} aria-hidden="true" />
                      </Item>
                    </div>
                  </Card>
                </MotionSurface>
              </MotionPresence>
            </TabsContent>
          ))}
          <p className="cw-demo-note">
            {t("An example workspace. Your next one is up to you.")}
          </p>
        </div>
      </Tabs>
    </section>
  );
}
