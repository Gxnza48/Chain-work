import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Circle,
  CircleDashed,
  Folder,
  Layers,
  ListTodo,
  MessageSquare,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ChainMark } from "@/components/layout/Logo";

const tasks = [
  {
    title: "Design the onboarding flow",
    project: "Website",
    status: "progress",
    person: "AG",
    priority: "High",
  },
  {
    title: "Connect the authentication",
    project: "Platform",
    status: "progress",
    person: "GB",
    priority: "High",
  },
  {
    title: "Review the launch checklist",
    project: "Website",
    status: "pending",
    person: "AG",
    priority: "Medium",
  },
  {
    title: "Ship the first release",
    project: "Platform",
    status: "done",
    person: "GB",
    priority: "Medium",
  },
];

/** Interactive, local-only product illustration. Never reads or writes account data. */
export function ProductPreview() {
  const t = useT();
  const [view, setView] = useState("tasks");
  const [completed, setCompleted] = useState<string[]>([tasks[3].title]);
  return (
    <div className="product-preview mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-white/15 bg-[#101012] text-left text-zinc-100">
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4 text-[11px] text-zinc-500">
        <div className="flex gap-1.5" aria-hidden="true">
          <i className="h-2 w-2 rounded-full bg-zinc-600" />
          <i className="h-2 w-2 rounded-full bg-zinc-700" />
          <i className="h-2 w-2 rounded-full bg-zinc-700" />
        </div>
        <span>chainwork · {t("Product preview")}</span>
        <span className="font-mono">2.0</span>
      </div>
      <div className="flex min-h-[350px] sm:min-h-[410px]">
        <aside className="hidden w-48 shrink-0 flex-col border-r border-white/10 bg-white/[.015] p-4 md:flex">
          <div className="mb-8 flex items-center gap-2 text-sm font-semibold">
            <ChainMark className="h-5 w-5" /> Studio{" "}
            <ChevronDown className="ml-auto h-3 w-3 text-zinc-500" />
          </div>
          <div className="mb-5 flex items-center gap-2 text-xs text-zinc-500">
            <Search className="h-3.5 w-3.5" />
            {t("Search")}
            <kbd className="ml-auto rounded border border-white/10 px-1">
              ⌘ K
            </kbd>
          </div>
          <p className="mb-3 text-[10px] font-medium text-zinc-500">
            {t("Workspace")}
          </p>
          {[
            { id: "tasks", label: "All tasks", icon: ListTodo },
            { id: "projects", label: "Projects", icon: Folder },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={cn(
                "mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors",
                view === id
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(label)}
            </button>
          ))}
          <div className="mt-2 flex items-center gap-2 px-2 text-xs text-zinc-500">
            <MessageSquare className="h-3.5 w-3.5" />
            {t("Chat")}
          </div>
          <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
            <Settings className="h-3.5 w-3.5" />
            {t("Settings")}
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </aside>
        <div className="min-w-0 flex-1 p-4 sm:p-7">
          <div className="mb-6 flex items-center gap-2 text-[11px] text-zinc-500">
            Studio <span>/</span>{" "}
            {t(view === "tasks" ? "All tasks" : "Projects")}
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t("In sync")}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t(
                view === "tasks"
                  ? "Good work starts here."
                  : "A place for every project.",
              )}
            </h2>
            <Layers className="h-4 w-4 shrink-0 text-zinc-500" />
          </div>
          <p className="mb-6 text-xs text-zinc-400">
            {t("One team. A clear next step.")}
          </p>
          <div className="mb-4 flex items-center gap-4 border-b border-white/10 pb-3 text-[11px]">
            <button
              onClick={() => setView("tasks")}
              aria-pressed={view === "tasks"}
              className={view === "tasks" ? "text-white" : "text-zinc-500"}
            >
              {t("All tasks")}
            </button>
            <button
              onClick={() => setView("projects")}
              aria-pressed={view === "projects"}
              className={view === "projects" ? "text-white" : "text-zinc-500"}
            >
              {t("Projects")}
            </button>
            <span className="ml-auto flex items-center gap-1 text-zinc-500">
              <SlidersHorizontal className="h-3 w-3" />
              {t("Overview")}
            </span>
          </div>
          {view === "tasks" ? (
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] text-zinc-500">
                <CircleDashed className="h-3 w-3" />
                {t("This week")}
                <span>{tasks.length}</span>
              </div>
              {tasks.map((task) => {
                const done = completed.includes(task.title);
                return (
                  <div
                    key={task.title}
                    className="flex items-center gap-3 border-b border-white/[.055] py-3.5 text-xs"
                  >
                    <button
                      aria-label={t(
                        done ? "Reopen {title}" : "Complete {title}",
                        { title: t(task.title) },
                      )}
                      aria-pressed={done}
                      onClick={() =>
                        setCompleted((current) =>
                          done
                            ? current.filter((title) => title !== task.title)
                            : [...current, task.title],
                        )
                      }
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors",
                        done
                          ? "bg-emerald-400/15 text-emerald-400"
                          : "text-zinc-500 hover:text-white",
                      )}
                    >
                      {done ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "min-w-0 flex-1",
                        done && "text-zinc-500 line-through",
                      )}
                    >
                      {t(task.title)}
                    </span>
                    <span className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:block">
                      {task.project}
                    </span>
                    <span className="hidden w-12 text-[10px] text-zinc-500 lg:block">
                      {t(task.priority)}
                    </span>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-zinc-800 text-[8px] text-zinc-300">
                      {task.person}
                    </span>
                  </div>
                );
              })}
              <p className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500">
                <Plus className="h-3 w-3" />
                {t("Try completing a task. This is your playground.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {["Website", "Platform"].map((name) => (
                <button
                  key={name}
                  onClick={() => setView("tasks")}
                  className="group rounded-lg border border-white/10 p-4 text-left transition-colors hover:bg-white/5"
                >
                  <Folder className="mb-6 h-5 w-5 text-zinc-400" />
                  <span className="flex items-center justify-between text-sm">
                    {name}
                    <ArrowUpRight className="h-3 w-3 text-zinc-500" />
                  </span>
                  <span className="mt-2 block text-[10px] text-zinc-500">
                    {t("2 tasks · Launch")}
                  </span>
                  <span className="mt-4 block h-1 rounded-full bg-white/5">
                    <span className="block h-1 w-1/2 rounded-full bg-zinc-400" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
