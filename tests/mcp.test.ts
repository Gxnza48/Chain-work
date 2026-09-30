import { beforeAll, describe, expect, it, vi } from "vitest";
import { validateArguments } from "../supabase/functions/mcp/validation";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.stubGlobal("Deno", { env: { get: () => "test" }, serve: vi.fn() });
let api: typeof import("../supabase/functions/mcp/index");
beforeAll(async () => {
  api = await import("../supabase/functions/mcp/index");
});
const uid = "00000000-0000-4000-8000-000000000001";
const chain = "00000000-0000-4000-8000-000000000002";
const taskId = "00000000-0000-4000-8000-000000000003";
const projectId = "00000000-0000-4000-8000-000000000004";

/** Query recorder with per-table result queues. No credentials or live database. */
function database(fixtures: Record<string, unknown[]>) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];
  const client = {
    from(table: string) {
      const reply = fixtures[table]?.shift() ?? { data: null, error: null };
      const q: Record<string, any> = {};
      for (const op of [
        "select",
        "eq",
        "in",
        "is",
        "neq",
        "contains",
        "ilike",
        "order",
        "limit",
        "range",
        "insert",
        "update",
        "single",
        "maybeSingle",
      ])
        q[op] = (...args: unknown[]) => {
          calls.push({ table, op, args });
          return q;
        };
      q.then = (resolve: (value: unknown) => void) =>
        Promise.resolve(reply).then(resolve);
      return q;
    },
  };
  return { client, calls };
}

describe("MCP protocol", () => {
  it("connects, discovers and calls tools through the official Streamable HTTP client", async () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      update: () => q,
      maybeSingle: () => q,
      then: (resolve: any) =>
        Promise.resolve({
          data: { id: "test-token", user_id: uid },
          error: null,
        }).then(resolve),
    };
    vi.mocked(createClient).mockReturnValue({ from: () => q } as any);
    const client = new McpClient({
      name: "chainwork-compatibility-test",
      version: "1.0.0",
    });
    const transport = new StreamableHTTPClientTransport(
      new URL("https://example.test/mcp"),
      {
        requestInit: {
          headers: { Authorization: "Bearer cw_test_local_only" },
        },
        fetch: (input, init) => api.handleRequest(new Request(input, init)),
      },
    );
    try {
      await client.connect(transport);
      expect(client.getServerVersion()?.version).toBe("2.0.0");
      expect((await client.listTools()).tools).toHaveLength(18);
      await client.ping();
      const result = await client.callTool({
        name: "set_task_status",
        arguments: { task_id: taskId, status: "invalid" },
      });
      expect(result.isError).toBe(true);
    } finally {
      await client.close();
    }
  });
  it("negotiates supported versions and advertises tools for both clients", async () => {
    const ctx = { userId: uid, client: {} };
    for (const client of ["codex", "claude-code"]) {
      const result = (await api.handleRpc(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            clientInfo: { name: client, version: "1" },
          },
        },
        ctx,
      )) as any;
      expect(result.result.protocolVersion).toBe("2025-03-26");
      expect(result.result.serverInfo.version).toBe("2.0.0");
    }
    const result = (await api.handleRpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      ctx,
    )) as any;
    expect(result.result.tools).toHaveLength(18);
    expect(
      result.result.tools.find((t: any) => t.name === "list_projects")
        .annotations.readOnlyHint,
    ).toBe(true);
    expect(
      result.result.tools.find((t: any) => t.name === "create_task").annotations
        .idempotentHint,
    ).toBe(false);
  });
  it("rejects malformed requests and ignores notifications without executing tools", async () => {
    const { client, calls } = database({});
    const ctx = { userId: uid, client };
    expect(
      ((await api.handleRpc({ method: "tools/list", id: 1 }, ctx)) as any).error
        .code,
    ).toBe(-32600);
    expect(
      await api.handleRpc(
        {
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "create_task",
            arguments: { chain, title: "Do not write" },
          },
        },
        ctx,
      ),
    ).toBeNull();
    expect(calls).toHaveLength(0);
    expect(
      (
        (await api.handleRpc(
          { jsonrpc: "2.0", id: 1, method: "ping", params: [] },
          ctx,
        )) as any
      ).error.code,
    ).toBe(-32602);
  });
  it("returns actionable tool errors for invalid input", async () => {
    const result = (await api.handleRpc(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "set_task_status",
          arguments: { task_id: taskId, status: "deleted" },
        },
      },
      { userId: uid, client: {} },
    )) as any;
    expect(result.result.isError).toBe(true);
  });
  it("returns 405 for SSE and preserves a public JSON health check", async () => {
    const health = await api.handleRequest(
      new Request("https://example.com/mcp"),
    );
    expect((await health.json()).server.version).toBe("2.0.0");
    expect(
      (
        await api.handleRequest(
          new Request("https://example.com/mcp", {
            headers: { Accept: "text/event-stream" },
          }),
        )
      ).status,
    ).toBe(405);
  });
  it("rejects unauthenticated POSTs", async () => {
    expect(
      (
        await api.handleRequest(
          new Request("https://example.com/mcp", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(401);
  });
});

describe("MCP authorization and compatibility", () => {
  it("blocks project data for non-members before reading context", async () => {
    const { client, calls } = database({
      projects: [{ data: { id: projectId, chain_id: chain } }],
      chain_members: [{ data: null }],
    });
    await expect(
      api.callTool(
        "get_project",
        { project_id: projectId },
        { client, userId: uid },
      ),
    ).rejects.toThrow("access denied");
    expect(
      calls.some((c) => c.table === "attachments" || c.table === "todos"),
    ).toBe(false);
  });
  it("blocks task writes for non-members", async () => {
    const { client, calls } = database({
      todos: [{ data: { id: taskId, chain_id: chain } }],
      chain_members: [{ data: null }],
    });
    await expect(
      api.callTool(
        "set_task_status",
        { task_id: taskId, status: "done" },
        { client, userId: uid },
      ),
    ).rejects.toThrow("not a member");
    expect(calls.some((c) => c.op === "update")).toBe(false);
  });
  it("blocks foreign projects and milestones before updating an authorized task", async () => {
    for (const foreign of ["project", "milestone"]) {
      const { client, calls } = database({
        todos: [
          { data: { id: taskId, chain_id: chain, project_id: projectId } },
        ],
        chain_members: [{ data: { user_id: uid } }],
        projects: [{ data: { chain_id: "foreign" } }],
        milestones: [{ data: { chain_id: chain, project_id: "foreign" } }],
      });
      await expect(
        api.callTool(
          "update_task",
          { task_id: taskId, [`${foreign}_id`]: projectId },
          { client, userId: uid },
        ),
      ).rejects.toThrow("does not belong");
      expect(calls.some((c) => c.op === "update")).toBe(false);
    }
  });
  it("does not clobber existing completion metadata", async () => {
    const todo = {
      id: taskId,
      chain_id: chain,
      status: "done",
      completed_at: "2026-01-01",
      completed_by: "original",
    };
    const { client, calls } = database({
      todos: [{ data: todo }],
      chain_members: [{ data: { user_id: uid } }],
    });
    await api.callTool(
      "complete_task",
      { task_id: taskId },
      { client, userId: uid },
    );
    expect(calls.some((c) => c.op === "update")).toBe(false);
  });
  it("maps subtask completion onto the existing done column", async () => {
    const { client, calls } = database({
      subtasks: [
        { data: { id: taskId, todo_id: taskId, chain_id: chain } },
        { data: { done: true } },
      ],
      todos: [{ data: { id: taskId, chain_id: chain } }],
      chain_members: [{ data: { user_id: uid } }],
    });
    await api.callTool(
      "update_subtask",
      { subtask_id: taskId, completed: true },
      { client, userId: uid },
    );
    expect(calls.find((c) => c.op === "update")?.args[0]).toEqual({
      done: true,
    });
  });
  it("paginates without losing the next row", async () => {
    const { client } = database({
      chains: [{ data: { id: chain, name: "Workspace" } }],
      chain_members: [{ data: { user_id: uid } }],
      todos: [{ data: [{ id: "a" }, { id: "b" }, { id: "c" }] }],
    });
    const result = (await api.callTool(
      "list_tasks",
      { chain, limit: 2, offset: 4 },
      { client, userId: uid },
    )) as any;
    expect(result.tasks.map((t: any) => t.id)).toEqual(["a", "b"]);
    expect(result.next_offset).toBe(6);
  });
  it("preserves PostgreSQL enum ordering for the next pending task", async () => {
    const { client, calls } = database({
      chains: [{ data: { id: chain } }],
      chain_members: [{ data: { user_id: uid } }],
      todos: [{ data: [] }],
    });
    await api.callTool("get_next_task", { chain }, { client, userId: uid });
    expect(
      calls.find(
        (c) =>
          c.table === "todos" && c.op === "order" && c.args[0] === "status",
      )?.args[1],
    ).toEqual({ ascending: true });
  });
});

describe("input validation", () => {
  it.each([null, [], "text", { title: "" }, { title: "x", extra: true }])(
    "rejects invalid arguments %j",
    (value) => {
      expect(() =>
        validateArguments(
          {
            type: "object",
            properties: { title: { type: "string" } },
            required: ["title"],
            additionalProperties: false,
          },
          value,
        ),
      ).toThrow();
    },
  );
  it("accepts nullable updates but rejects impossible dates", () => {
    const schema = {
      type: "object",
      properties: { due_date: { type: ["string", "null"] } },
    };
    expect(() => validateArguments(schema, { due_date: null })).not.toThrow();
    expect(() =>
      validateArguments(schema, { due_date: "2026-02-30" }),
    ).toThrow();
  });
});
