// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { TodoList } from "../src/components/todos/TodoList";

const records = [
  {
    id: "standalone",
    chain_id: "chain",
    project_id: null,
    title: "Standalone",
    status: "pending",
    priority: "medium",
  },
  {
    id: "project-task",
    chain_id: "chain",
    project_id: "project",
    title: "Project task",
    status: "pending",
    priority: "high",
  },
  {
    id: "foreign",
    chain_id: "other",
    project_id: "other-project",
    title: "Foreign task",
    status: "pending",
    priority: "low",
  },
];
const state = vi.hoisted(() => ({
  fail: false,
  queriedTables: [] as string[],
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from(table: string) {
      state.queriedTables.push(table);
      let rows: any[] =
        table === "todos"
          ? [...records]
          : table === "projects"
            ? [{ id: "project", name: "Website", chain_id: "chain" }]
            : [];
      const q: any = {
        select: () => q,
        order: () => q,
        eq: (field: string, value: unknown) => {
          rows = rows.filter((row) => row[field] === value);
          return q;
        },
        is: (field: string, value: unknown) => {
          rows = rows.filter((row) => row[field] === value);
          return q;
        },
        then: (resolve: any) =>
          Promise.resolve({
            data: rows,
            error: state.fail ? { message: "offline" } : null,
          }).then(resolve),
      };
      return q;
    },
    channel: () => {
      const ch: any = { on: () => ch, subscribe: () => ch };
      return ch;
    },
    removeChannel: () => Promise.resolve(),
  },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "me" } }) }));
vi.mock("@/hooks/useLabels", () => ({
  useLabels: () => ({
    labels: [],
    linksByTodo: new Map(),
    labelsForTodo: () => [],
  }),
}));
vi.mock("@/hooks/useMilestones", () => ({
  useMilestones: () => ({ milestones: [] }),
}));
vi.mock("@/lib/i18n", () => ({ useT: () => (key: string) => key }));
vi.mock("@/components/todos/TodoItem", () => ({
  TodoItem: ({ todo, projectName }: any) => (
    <li>
      {todo.title}
      <span>{projectName}</span>
    </li>
  ),
}));
vi.mock("@/components/todos/TodoForm", () => ({
  TodoForm: ({ projectId }: any) => (
    <form aria-label="New task">{projectId ?? "no-project"}</form>
  ),
}));
vi.mock("@/components/todos/LabelManager", () => ({
  LabelManager: () => null,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
beforeEach(() => {
  state.fail = false;
  localStorage.clear();
});
afterEach(cleanup);

describe("unified task view", () => {
  it("includes project and standalone tasks, but never another chain", async () => {
    render(<TodoList chainId="chain" scope="all" members={[]} />);
    expect(await screen.findByText("Project task")).toBeInTheDocument();
    expect(screen.getByText("Standalone")).toBeInTheDocument();
    expect(screen.queryByText("Foreign task")).not.toBeInTheDocument();
    expect(await screen.findByText("Website")).toBeInTheDocument();
  });
  it("preserves project-only scope", async () => {
    render(<TodoList chainId="chain" projectId="project" members={[]} />);
    expect(await screen.findByText("Project task")).toBeInTheDocument();
    expect(screen.queryByText("Standalone")).not.toBeInTheDocument();
  });
  it("preserves the old standalone scope for existing callers", async () => {
    render(<TodoList chainId="chain" projectId={null} members={[]} />);
    expect(await screen.findByText("Standalone")).toBeInTheDocument();
    expect(screen.queryByText("Project task")).not.toBeInTheDocument();
  });
  it("searches across the loaded projects and clears filters", async () => {
    render(<TodoList chainId="chain" scope="all" members={[]} />);
    await screen.findByText("Project task");
    fireEvent.change(screen.getByLabelText("Search todos…"), {
      target: { value: "Standalone" },
    });
    expect(screen.queryByText("Project task")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Clear filters"));
    expect(screen.getByText("Project task")).toBeInTheDocument();
  });
  it("shows a retryable error instead of claiming no tasks exist", async () => {
    state.fail = true;
    render(<TodoList chainId="chain" scope="all" members={[]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load todos",
    );
    expect(screen.queryByText("No todos here yet.")).not.toBeInTheDocument();
    state.fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText("Project task")).toBeInTheDocument(),
    );
  });
});
