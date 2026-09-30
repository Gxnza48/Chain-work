import { describe, expect, it } from "vitest";
import {
  readWorkspaceLocation,
  workspaceSearch,
} from "../src/lib/workspace-navigation";
import { connectionSnippet, mcpEndpoint } from "../src/lib/mcp-connection";

describe("workspace deep links", () => {
  it.each(["projects", "todos", "ideas", "chat"])(
    "round trips the %s tab",
    (tab) => {
      expect(readWorkspaceLocation(workspaceSearch(tab)).tab).toBe(tab);
    },
  );
  it("preserves legacy project links and drops stale project state when navigating", () => {
    expect(
      readWorkspaceLocation(new URLSearchParams("project=abc&tab=chat")),
    ).toEqual({ tab: "projects", project: "abc" });
    expect(workspaceSearch("todos").has("project")).toBe(false);
    expect(readWorkspaceLocation(new URLSearchParams("tab=unknown")).tab).toBe(
      "projects",
    );
  });
});
describe("client connection configs", () => {
  it("keeps the deployed legacy endpoint and supports explicit overrides", () => {
    expect(mcpEndpoint("https://test.supabase.co/")).toBe(
      "https://test.supabase.co/functions/v1/dynamic-task",
    );
    expect(
      mcpEndpoint("https://test.supabase.co", "https://mcp.example.com"),
    ).toBe("https://mcp.example.com");
  });
  it("generates configs that reference an environment variable, never a key", () => {
    const codex = connectionSnippet("codex", "https://mcp.example.com");
    const claude = JSON.parse(
      connectionSnippet("claude", "https://mcp.example.com"),
    );
    expect(codex).toContain('bearer_token_env_var = "CHAINWORK_API_KEY"');
    expect(claude.mcpServers.chainwork.headers.Authorization).toBe(
      "Bearer ${CHAINWORK_API_KEY}",
    );
    expect(codex).not.toContain("cw_live_");
  });
});
