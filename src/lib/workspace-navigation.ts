export type WorkspaceTab = "projects" | "todos" | "ideas" | "chat";
const tabs: WorkspaceTab[] = ["projects", "todos", "ideas", "chat"];

export function readWorkspaceLocation(params: URLSearchParams): {
  tab: WorkspaceTab;
  project: string | null;
} {
  const project = params.get("project");
  const candidate = params.get("tab") as WorkspaceTab;
  return {
    tab: project
      ? "projects"
      : tabs.includes(candidate)
        ? candidate
        : "projects",
    project,
  };
}

export function workspaceSearch(
  tab: string,
  project?: string,
): URLSearchParams {
  const params = new URLSearchParams();
  if (project) params.set("project", project);
  else if (tab !== "projects" && tabs.includes(tab as WorkspaceTab))
    params.set("tab", tab);
  return params;
}
