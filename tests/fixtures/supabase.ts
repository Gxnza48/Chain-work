// In-memory QA backend. Used ONLY by tests/preview.config.ts; never bundled by
// the production Vite config. UI testing cannot reach production or use keys.
export const userId = "00000000-0000-4000-8000-000000000001";
export const chainId = "00000000-0000-4000-8000-000000000002";
const projectId = "00000000-0000-4000-8000-000000000004";
const user = {
  id: userId,
  email: "qa@example.test",
  email_confirmed_at: "2026-09-01",
  user_metadata: {},
};
const profile = {
  ...user,
  username: "qa",
  display_name: "Equipo de prueba",
  avatar_url: null,
  bio: "",
  website: null,
  created_at: "2026-09-01T12:00:00Z",
};
const chain = {
  id: chainId,
  name: "Studio de prueba",
  code: "QASTUDIO",
  created_by: userId,
  created_at: "2026-09-01T12:00:00Z",
};
const now = "2026-09-30T12:00:00Z";
const data: Record<string, any[]> = {
  users: [profile],
  chains: [chain],
  chain_members: [
    {
      id: "membership",
      chain_id: chainId,
      user_id: userId,
      role: "owner",
      joined_at: now,
      chains: chain,
      users: profile,
    },
  ],
  projects: [
    {
      id: projectId,
      chain_id: chainId,
      name: "Lanzamiento web",
      description:
        "Una experiencia más clara para nuestro próximo lanzamiento.",
      created_by: userId,
      created_at: now,
    },
  ],
  todos: [
    {
      id: "task-1",
      title: "Diseñar la nueva bienvenida",
      project_id: projectId,
      status: "pending",
      priority: "high",
    },
    {
      id: "task-2",
      title: "Revisar los accesos del equipo",
      project_id: null,
      status: "pending",
      priority: "medium",
    },
    {
      id: "task-3",
      title: "Conectar el flujo de registro",
      project_id: projectId,
      status: "in_progress",
      priority: "critical",
    },
    {
      id: "task-4",
      title: "Definir la dirección visual",
      project_id: projectId,
      status: "done",
      priority: "low",
    },
  ].map((task, i) => ({
    ...task,
    chain_id: chainId,
    created_by: userId,
    assignees: [userId],
    assigned_to: userId,
    order_index: i,
    description: "Tarea de prueba local. No pertenece a una cuenta real.",
    due_date: null,
    created_at: now,
    completed_at: task.status === "done" ? now : null,
    completed_by: task.status === "done" ? userId : null,
    milestone_id: null,
    last_nudged_at: null,
  })),
  milestones: [],
  labels: [],
  todo_labels: [],
  comments: [],
  subtasks: [],
  ideas: [],
  attachments: [],
  notifications: [],
  mcp_tokens: [],
  chat_messages: [],
};

function query(table: string) {
  let rows = [...(data[table] ?? [])];
  let single = false;
  let mutation: Record<string, unknown> | undefined;
  let operation: "update" | "insert" | "delete" | undefined;
  const q: any = {
    select: () => q,
    eq: (key: string, value: unknown) => {
      rows = rows.filter((r) => r[key] === value);
      return q;
    },
    neq: (key: string, value: unknown) => {
      rows = rows.filter((r) => r[key] !== value);
      return q;
    },
    is: (key: string, value: unknown) => {
      rows = rows.filter((r) => r[key] === value);
      return q;
    },
    in: (key: string, values: unknown[]) => {
      rows = rows.filter((r) => values.includes(r[key]));
      return q;
    },
    contains: (key: string, values: unknown[]) => {
      rows = rows.filter((r) => values.every((v) => r[key]?.includes(v)));
      return q;
    },
    order: () => q,
    limit: (n: number) => {
      rows = rows.slice(0, n);
      return q;
    },
    range: (a: number, b: number) => {
      rows = rows.slice(a, b + 1);
      return q;
    },
    gt: () => q,
    gte: () => q,
    lt: () => q,
    lte: () => q,
    or: () => q,
    not: () => q,
    maybeSingle: () => {
      single = true;
      return q;
    },
    single: () => {
      single = true;
      return q;
    },
    update: (patch: Record<string, unknown>) => {
      mutation = patch;
      operation = "update";
      return q;
    },
    insert: (patch: Record<string, unknown>) => {
      mutation = patch;
      operation = "insert";
      return q;
    },
    upsert: () => q,
    delete: () => {
      operation = "delete";
      return q;
    },
    then: (resolve: (value: unknown) => void) => {
      if (operation === "update")
        rows.forEach((r) => Object.assign(r, mutation));
      if (operation === "insert") {
        const row = { id: crypto.randomUUID(), created_at: now, ...mutation };
        (data[table] ??= []).push(row);
        rows = [row];
      }
      if (operation === "delete")
        data[table] = data[table].filter((r) => !rows.includes(r));
      return Promise.resolve({
        data: single ? (rows[0] ?? null) : rows,
        count: rows.length,
        error: null,
      }).then(resolve);
    },
  };
  return q;
}
export const supabase: any = {
  from: query,
  auth: {
    getSession: async () => ({
      data: {
        session: {
          user,
          access_token: "local-fixture",
          refresh_token: "local-fixture",
        },
      },
      error: null,
    }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
  },
  channel: () => {
    const channel: any = {
      on: () => channel,
      subscribe: (callback?: (status: string) => void) => {
        callback?.("SUBSCRIBED");
        return channel;
      },
      track: async () => {},
      untrack: async () => {},
      presenceState: () => ({}),
      unsubscribe: async () => {},
    };
    return channel;
  },
  removeChannel: async () => {},
  rpc: async () => ({ data: [], error: null }),
  functions: { invoke: async () => ({ data: {}, error: null }) },
  storage: {
    from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }),
  },
};
export const hasSupabaseEnv = true;
