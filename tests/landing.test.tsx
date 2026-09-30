// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import { useLangStore } from "@/store/lang";
import { useThemeStore } from "@/store/theme";

const auth = vi.hoisted(() => ({
  user: null as null | { id: string },
  loading: false,
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));

beforeEach(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      addEventListener() {},
      removeEventListener() {},
    },
  });
  auth.user = null;
  useLangStore.getState().setLang("en");
  useThemeStore.getState().setTheme("dark");
  // Exercise the real components with the user's reduced-motion preference.
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function mount() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe("Landing interaction and preservation", () => {
  it("routes guest and authenticated calls to action to the existing destinations", () => {
    mount();
    for (const link of screen.getAllByRole("link", {
      name: "Start building free",
    })) {
      expect(link).toHaveAttribute("href", "/auth?mode=register");
    }
    expect(
      screen.getByRole("link", { name: "Connect your assistant" }),
    ).toHaveAttribute("href", "/auth?mode=register");
    cleanup();
    auth.user = { id: "fixture-user" };
    mount();
    for (const link of screen.getAllByRole("link", {
      name: "Open dashboard",
    })) {
      expect(link).toHaveAttribute("href", "/dashboard");
    }
    expect(
      screen.getByRole("link", { name: "Connect your assistant" }),
    ).toHaveAttribute("href", "/settings#integrations");
  });

  it("keeps one preview panel visible and updates only local sample progress", async () => {
    mount();
    const preview = within(
      screen.getByLabelText("Interactive ChainWork preview"),
    );
    fireEvent.click(
      preview.getByRole("button", {
        name: "Complete Design the onboarding flow",
      }),
    );
    expect(
      preview.getByRole("progressbar", { name: "Launch milestone progress" }),
    ).toHaveAttribute("aria-valuenow", "2");
    await userEvent.click(preview.getByRole("tab", { name: "Projects" }));
    await userEvent.click(preview.getByRole("tab", { name: "Context" }));
    expect(preview.getAllByRole("tabpanel")).toHaveLength(1);
    expect(preview.getByRole("tabpanel")).toHaveAccessibleName("Context");
    expect(
      preview.queryByRole("button", { name: "View tasks" }),
    ).not.toBeInTheDocument();
    fireEvent.click(preview.getByRole("button", { name: "Reset preview" }));
    expect(preview.getByRole("tabpanel")).toHaveAccessibleName("Tasks");
    expect(
      preview.getByRole("progressbar", { name: "Launch milestone progress" }),
    ).toHaveAttribute("aria-valuenow", "1");
  });

  it("supports both assistants, Spanish copy and immediate reduced-motion surfaces", async () => {
    const { container } = mount();
    expect(
      container.querySelector('[data-motion-quiet="true"]'),
    ).not.toBeNull();
    expect([...container.querySelectorAll('[data-motion-surface]')].every(
      (element) => element.getAttribute('data-motion-quiet') === 'true',
    )).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Claude Code", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Progress", exact: true }),
    );
    expect(
      screen.getByRole("button", { name: "Claude Code", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await screen.findByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          element.textContent === "chainwork.complete_task",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a español" }));
    expect(
      screen.getByRole("tab", { name: "Tareas", exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Todo tu equipo.",
    );
    fireEvent.click(screen.getByRole("button", { name: "¿Qué es una chain?" }));
    expect(
      screen.getByRole("button", { name: "¿Qué es una chain?" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
