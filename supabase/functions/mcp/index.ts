// ============================================================================
// ChainWork MCP server — Supabase Edge Function (Deno).
//
// Exposes ChainWork (your chains + their todos/tasks) as MCP tools so Claude
// Code can read a chain's tasks, work on them, and mark them done. The "push to
// GitHub" step is Claude Code's own job (its git/Bash tools) — this server is
// only the ChainWork bridge.
//
// TRANSPORT: MCP Streamable HTTP, stateless. Each POST carries one (or a batch
// of) JSON-RPC 2.0 message(s); we answer with a single application/json body.
// No SSE, no session state — perfect for a serverless function.
//
// AUTH: a ChainWork API key (cw_live_…) generated in Settings → Integrations,
// presented as `Authorization: Bearer <key>` (or `X-ChainWork-Key: <key>`).
// We SHA-256 it and look it up in public.mcp_tokens with the service role, then
// act scoped to that user, re-checking chain_members membership on every call.
//
// DEPLOY: this function MUST be deployed with "Verify JWT" DISABLED (dashboard
// toggle, or `verify_jwt = false`) so the gateway forwards our own Authorization
// header instead of demanding a Supabase JWT. No extra secrets are needed —
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// CONNECT (in a terminal, once the key is generated in Settings):
//   claude mcp add --transport http chainwork \
//     https://<project-ref>.supabase.co/functions/v1/mcp \
//     --header "Authorization: Bearer cw_live_xxx"
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const SERVER_INFO = { name: 'chainwork', version: '1.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';
// MCP protocol versions this server actually speaks. On initialize we echo the
// client's requested version only if it's here; otherwise we advertise our
// latest (DEFAULT_PROTOCOL) so the client can fall back or disconnect — never
// claim to support a version we don't implement.
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-chainwork-key, content-type, x-client-info, apikey, mcp-protocol-version, mcp-session-id, accept',
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function jsonResp(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}
function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function db() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// deno-lint-ignore no-explicit-any
type Client = any;
interface Ctx {
  userId: string;
  client: Client;
}

// Resolve the ChainWork API key from the request -> { userId, client } or null.
async function authenticate(req: Request): Promise<Ctx | null> {
  const auth = req.headers.get('authorization') ?? '';
  const xkey = req.headers.get('x-chainwork-key') ?? '';
  let raw = auth ? auth.replace(/^Bearer\s+/i, '').trim() : '';
  if (!raw && xkey) raw = xkey.trim();
  if (!raw || !raw.startsWith('cw_')) return null;

  const hash = await sha256hex(raw);
  const client = db();
  const { data } = await client
    .from('mcp_tokens')
    .select('id, user_id')
    .eq('token_hash', hash)
    .maybeSingle();
  if (!data) return null;

  // Stamp "last used". Awaited (not fire-and-forget): a serverless instance can
  // be frozen right after the response is sent, dropping un-awaited work.
  try {
    await client
      .from('mcp_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
  } catch {
    // best-effort only
  }

  return { userId: data.user_id, client };
}

async function isMember(client: Client, chainId: string, userId: string): Promise<boolean> {
  const { data } = await client
    .from('chain_members')
    .select('user_id')
    .eq('chain_id', chainId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A "chain" argument may be a chain id (uuid) or its 8-char join code.
async function resolveChain(
  client: Client,
  ref: string,
): Promise<{ id: string; name: string; code: string } | null> {
  if (!ref) return null;
  if (UUID_RE.test(ref)) {
    const { data } = await client.from('chains').select('id, name, code').eq('id', ref).maybeSingle();
    if (data) return data;
  }
  const { data } = await client
    .from('chains')
    .select('id, name, code')
    .eq('code', ref.toUpperCase())
    .maybeSingle();
  return data ?? null;
}

async function getAuthorizedTodo(client: Client, taskId: string, userId: string) {
  if (!taskId) throw new Error('task_id is required');
  const { data: todo } = await client.from('todos').select('*').eq('id', taskId).maybeSingle();
  if (!todo) throw new Error(`Task not found: ${taskId}`);
  if (!(await isMember(client, todo.chain_id, userId)))
    throw new Error("You are not a member of this task's chain");
  return todo;
}

// deno-lint-ignore no-explicit-any
function compactTodo(t: any) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    chain_id: t.chain_id,
    project_id: t.project_id,
    milestone_id: t.milestone_id,
    due_date: t.due_date,
    assignees: t.assignees ?? [],
    created_at: t.created_at,
    completed_at: t.completed_at,
  };
}

// Mirror the app's completion semantics + the 0019 notification fan-out (the DB
// trigger early-returns under the service role because auth.uid() is null).
// Idempotent: stamps completed_at/completed_by ONLY on a real transition INTO
// 'done' and clears them ONLY on a real transition OUT of 'done' — so
// re-completing an already-done task never clobbers who/when finished it
// (matches TodoItem.tsx + the trigger's "is distinct" guard).
// deno-lint-ignore no-explicit-any
async function markStatus(client: Client, todo: any, status: string, userId: string) {
  if (status === todo.status) return todo; // no-op: don't touch completion metadata
  // deno-lint-ignore no-explicit-any
  const patch: any = { status };
  if (status === 'done') {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = userId;
  } else if (todo.status === 'done') {
    patch.completed_at = null;
    patch.completed_by = null;
  }
  const { data, error } = await client
    .from('todos')
    .update(patch)
    .eq('id', todo.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  if (status === 'done') await notifyTodoDone(client, data, userId);
  return data;
}

// --- Authorization helpers: the service role bypasses RLS, so a task's
// project/milestone/assignees must be explicitly proven to belong to the task's
// chain before we write or expose them (otherwise a member of chain A could
// reference or leak chain B's rows). ---

async function assertProjectInChain(client: Client, projectId: string | null | undefined, chainId: string) {
  if (!projectId) return;
  const { data } = await client.from('projects').select('chain_id').eq('id', projectId).maybeSingle();
  if (!data) throw new Error(`Project not found: ${projectId}`);
  if (data.chain_id !== chainId) throw new Error('project_id does not belong to this chain');
}

async function assertMilestoneInChain(client: Client, milestoneId: string | null | undefined, chainId: string) {
  if (!milestoneId) return;
  const { data } = await client.from('milestones').select('chain_id').eq('id', milestoneId).maybeSingle();
  if (!data) throw new Error(`Milestone not found: ${milestoneId}`);
  if (data.chain_id !== chainId) throw new Error('milestone_id does not belong to this chain');
}

// Returns the deduped assignee ids, throwing if any is not a member of the chain.
async function validateAssignees(client: Client, raw: unknown, chainId: string): Promise<string[]> {
  const ids = [...new Set((Array.isArray(raw) ? raw : []).filter((x) => typeof x === 'string' && x))] as string[];
  if (ids.length === 0) return [];
  const { data } = await client
    .from('chain_members')
    .select('user_id')
    .eq('chain_id', chainId)
    .in('user_id', ids);
  // deno-lint-ignore no-explicit-any
  const members = new Set((data ?? []).map((m: any) => m.user_id));
  const invalid = ids.filter((id) => !members.has(id));
  if (invalid.length) throw new Error(`Not members of this chain: ${invalid.join(', ')}`);
  return ids;
}

// deno-lint-ignore no-explicit-any
async function notifyTodoDone(client: Client, todo: any, actorId: string) {
  const recipients = new Set<string>();
  if (todo.created_by) recipients.add(todo.created_by);
  for (const a of todo.assignees ?? []) if (a) recipients.add(a);
  recipients.delete(actorId);
  if (recipients.size === 0) return;
  const rows = [...recipients].map((uid) => ({
    user_id: uid,
    chain_id: todo.chain_id,
    actor_id: actorId,
    type: 'todo_done',
    title: 'Todo completed',
    body: String(todo.title ?? '').slice(0, 120),
    link: `/chain/${todo.chain_id}`,
    entity_id: todo.id,
  }));
  await client.from('notifications').insert(rows);
}

// deno-lint-ignore no-explicit-any
async function notifyComment(client: Client, comment: any, todoTitle: string, actorId: string) {
  const { data: members } = await client
    .from('chain_members')
    .select('user_id')
    .eq('chain_id', comment.chain_id);
  const recipients = (members ?? [])
    // deno-lint-ignore no-explicit-any
    .map((m: any) => m.user_id)
    .filter((u: string) => u && u !== actorId);
  if (recipients.length === 0) return;
  const rows = recipients.map((uid: string) => ({
    user_id: uid,
    chain_id: comment.chain_id,
    actor_id: actorId,
    type: 'comment',
    title: 'New comment',
    body: String(todoTitle ?? '').slice(0, 120),
    link: `/chain/${comment.chain_id}`,
    entity_id: comment.todo_id,
  }));
  await client.from('notifications').insert(rows);
}

// ---------------------------------------------------------------------------
// Tool definitions (advertised via tools/list)
// ---------------------------------------------------------------------------

const CHAIN_ARG = {
  type: 'string',
  description: 'Chain id (uuid) or its 8-character join code (e.g. "AB12CD34").',
};

const TOOLS = [
  {
    name: 'whoami',
    description: 'Return the ChainWork user this API key belongs to. Useful to confirm the connection works.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_chains',
    description: 'List the chains (shared workspaces) the authenticated user belongs to, with id, name, 8-char code and role.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_tasks',
    description:
      'List tasks (todos) in a chain. Optionally filter by status, by project, or to chain-level tasks only (project_id null). Returns a compact list; use get_task for full detail.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: CHAIN_ARG,
        status: { type: 'string', enum: ['pending', 'in_progress', 'done'], description: 'Only tasks in this status.' },
        project_id: { type: 'string', description: 'Only tasks in this project.' },
        scope: {
          type: 'string',
          enum: ['all', 'chain_level'],
          description: '"chain_level" = only tasks not tied to a project (project_id null). Default "all".',
        },
        limit: { type: 'number', description: 'Max rows (default 50, max 200).' },
      },
      required: ['chain'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_next_task',
    description:
      'Get a single "next" task of a chain. mode="next_pending" (default) = the next actionable task to work on (not done; pending before in_progress, then manual order, then oldest first). mode="newest" = the most recently created task, any status.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: CHAIN_ARG,
        mode: { type: 'string', enum: ['next_pending', 'newest'], description: 'Default "next_pending".' },
      },
      required: ['chain'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_task',
    description:
      'Get full detail of one task: description, priority, status, assignees (with names), its project, due date, and any repo links attached to that project (handy to know where to push code).',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'string' } },
      required: ['task_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a chain (optionally inside a project). The authenticated user becomes the creator.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: CHAIN_ARG,
        title: { type: 'string' },
        description: { type: 'string' },
        project_id: { type: 'string', description: 'Optional project to file it under; omit for a chain-level task.' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Default "medium".' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'done'], description: 'Default "pending".' },
        due_date: { type: 'string', description: 'Due date as YYYY-MM-DD (date only, not a timestamp).' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'User ids to assign.' },
      },
      required: ['chain', 'title'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_task',
    description:
      'Update fields of an existing task (title, description, priority, due_date, project_id, milestone_id, assignees, and/or status). Changing status to "done" stamps completion and notifies the chain; moving it off "done" re-opens it.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        status: { type: 'string', enum: ['pending', 'in_progress', 'done'] },
        due_date: { type: 'string', description: 'YYYY-MM-DD or null to clear.' },
        project_id: { type: 'string' },
        milestone_id: { type: 'string' },
        assignees: { type: 'array', items: { type: 'string' } },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'set_task_status',
    description: 'Set a task\'s status to "pending", "in_progress" or "done". Use "in_progress" when you start working on it.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'done'] },
      },
      required: ['task_id', 'status'],
      additionalProperties: false,
    },
  },
  {
    name: 'complete_task',
    description:
      'Mark a task as done (sets status=done + completion stamp + notifies the creator/assignees). Optionally attach a note as a comment (e.g. the commit hash or PR URL). Call this AFTER you have finished the work and pushed.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        note: { type: 'string', description: 'Optional comment to attach, e.g. "Done — pushed in commit abc1234".' },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'add_comment',
    description: 'Add a comment to a task. Notifies the other chain members.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['task_id', 'body'],
      additionalProperties: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
async function callTool(name: string, args: any, ctx: Ctx): Promise<unknown> {
  const { userId, client } = ctx;

  switch (name) {
    case 'whoami': {
      const { data } = await client
        .from('users')
        .select('id, username, display_name')
        .eq('id', userId)
        .maybeSingle();
      return data ?? { id: userId };
    }

    case 'list_chains': {
      const { data } = await client
        .from('chain_members')
        .select('role, chains(id, name, code)')
        .eq('user_id', userId);
      return (data ?? [])
        // deno-lint-ignore no-explicit-any
        .filter((r: any) => r.chains)
        // deno-lint-ignore no-explicit-any
        .map((r: any) => ({ id: r.chains.id, name: r.chains.name, code: r.chains.code, role: r.role }));
    }

    case 'list_tasks': {
      const chain = await resolveChain(client, args.chain);
      if (!chain) throw new Error(`Chain not found: ${args.chain}`);
      if (!(await isMember(client, chain.id, userId))) throw new Error('You are not a member of this chain');
      const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 200);
      let q = client.from('todos').select('*').eq('chain_id', chain.id);
      if (args.status) q = q.eq('status', args.status);
      if (args.project_id) q = q.eq('project_id', args.project_id);
      if (args.scope === 'chain_level') q = q.is('project_id', null);
      q = q.order('status', { ascending: true })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { chain: { id: chain.id, name: chain.name, code: chain.code }, count: (data ?? []).length, tasks: (data ?? []).map(compactTodo) };
    }

    case 'get_next_task': {
      const chain = await resolveChain(client, args.chain);
      if (!chain) throw new Error(`Chain not found: ${args.chain}`);
      if (!(await isMember(client, chain.id, userId))) throw new Error('You are not a member of this chain');
      const mode = args.mode === 'newest' ? 'newest' : 'next_pending';
      let q = client.from('todos').select('*').eq('chain_id', chain.id);
      if (mode === 'newest') {
        q = q.order('created_at', { ascending: false }).limit(1);
      } else {
        q = q
          .neq('status', 'done')
          .order('status', { ascending: true })
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1);
      }
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const todo = (data ?? [])[0];
      if (!todo) return { mode, task: null, message: mode === 'next_pending' ? 'No open tasks in this chain.' : 'This chain has no tasks yet.' };
      return { mode, task: compactTodo(todo), description: todo.description ?? null };
    }

    case 'get_task': {
      const todo = await getAuthorizedTodo(client, args.task_id, userId);
      let assignees: unknown[] = [];
      if ((todo.assignees ?? []).length) {
        const { data } = await client
          .from('users')
          .select('id, display_name, username')
          .in('id', todo.assignees);
        assignees = data ?? [];
      }
      let project = null;
      let repo_links: string[] = [];
      if (todo.project_id) {
        const { data: p } = await client
          .from('projects')
          .select('id, name, chain_id')
          .eq('id', todo.project_id)
          .maybeSingle();
        // Only expose the project + its repo links if it actually belongs to this
        // task's chain (defends against a task with a foreign/mismatched project_id).
        if (p && p.chain_id === todo.chain_id) {
          project = { id: p.id, name: p.name };
          const { data: atts } = await client
            .from('attachments')
            .select('url, title')
            .eq('project_id', todo.project_id)
            .eq('type', 'repo');
          // deno-lint-ignore no-explicit-any
          repo_links = (atts ?? []).map((a: any) => a.url);
        }
      }
      return { ...compactTodo(todo), description: todo.description ?? null, project, assignees, repo_links };
    }

    case 'create_task': {
      const chain = await resolveChain(client, args.chain);
      if (!chain) throw new Error(`Chain not found: ${args.chain}`);
      if (!(await isMember(client, chain.id, userId))) throw new Error('You are not a member of this chain');
      if (!args.title || !String(args.title).trim()) throw new Error('title is required');
      await assertProjectInChain(client, args.project_id, chain.id);
      const assignees = await validateAssignees(client, args.assignees, chain.id);
      const { data, error } = await client
        .from('todos')
        .insert({
          chain_id: chain.id,
          project_id: args.project_id ?? null,
          title: String(args.title).trim(),
          description: args.description ?? null,
          status: args.status ?? 'pending',
          priority: args.priority ?? 'medium',
          due_date: args.due_date ?? null,
          assignees,
          assigned_to: assignees[0] ?? null,
          created_by: userId,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return compactTodo(data);
    }

    case 'update_task': {
      const todo = await getAuthorizedTodo(client, args.task_id, userId);
      if ('project_id' in args) await assertProjectInChain(client, args.project_id, todo.chain_id);
      if ('milestone_id' in args) await assertMilestoneInChain(client, args.milestone_id, todo.chain_id);
      // deno-lint-ignore no-explicit-any
      const patch: any = {};
      for (const f of ['title', 'description', 'priority', 'due_date', 'project_id', 'milestone_id']) {
        if (f in args) patch[f] = args[f];
      }
      if ('assignees' in args) {
        const a = await validateAssignees(client, args.assignees, todo.chain_id);
        patch.assignees = a;
        patch.assigned_to = a[0] ?? null;
      }
      const statusChanges = 'status' in args && args.status !== todo.status;
      if (Object.keys(patch).length) {
        const { error } = await client.from('todos').update(patch).eq('id', todo.id);
        if (error) throw new Error(error.message);
      }
      let updated = { ...todo, ...patch };
      if (statusChanges) updated = await markStatus(client, updated, args.status, userId);
      else if (Object.keys(patch).length) {
        const { data } = await client.from('todos').select('*').eq('id', todo.id).single();
        updated = data;
      }
      return compactTodo(updated);
    }

    case 'set_task_status': {
      const todo = await getAuthorizedTodo(client, args.task_id, userId);
      if (!['pending', 'in_progress', 'done'].includes(args.status)) throw new Error('Invalid status');
      const updated = await markStatus(client, todo, args.status, userId);
      return compactTodo(updated);
    }

    case 'complete_task': {
      const todo = await getAuthorizedTodo(client, args.task_id, userId);
      const updated = await markStatus(client, todo, 'done', userId);
      if (args.note && String(args.note).trim()) {
        const { data: c } = await client
          .from('comments')
          .insert({ chain_id: todo.chain_id, todo_id: todo.id, user_id: userId, body: String(args.note).trim() })
          .select('*')
          .single();
        if (c) await notifyComment(client, c, todo.title, userId);
      }
      return { ok: true, task: compactTodo(updated) };
    }

    case 'add_comment': {
      const todo = await getAuthorizedTodo(client, args.task_id, userId);
      if (!args.body || !String(args.body).trim()) throw new Error('body is required');
      const { data: c, error } = await client
        .from('comments')
        .insert({ chain_id: todo.chain_id, todo_id: todo.id, user_id: userId, body: String(args.body).trim() })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await notifyComment(client, c, todo.title, userId);
      return { ok: true, comment_id: c.id };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC routing
// ---------------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
async function handleRpc(msg: any, ctx: Ctx): Promise<unknown | null> {
  if (!msg || typeof msg !== 'object') return rpcError(null, -32600, 'Invalid Request');
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : DEFAULT_PROTOCOL;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
    }
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS });
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};
      try {
        const result = await callTool(toolName, toolArgs, ctx);
        const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        return rpcResult(id, { content: [{ type: 'text', text }], isError: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return rpcResult(id, { content: [{ type: 'text', text: `Error: ${message}` }], isError: true });
      }
    }
    default:
      // Notifications (e.g. notifications/initialized) get no response body.
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// HTTP entrypoint
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // A bare GET is a friendly health check (no SSE stream in stateless mode).
  if (req.method === 'GET') return jsonResp(200, { ok: true, server: SERVER_INFO });
  if (req.method !== 'POST') return jsonResp(405, { error: 'Method Not Allowed' });

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return jsonResp(500, rpcError(null, -32002, 'Server misconfigured: missing Supabase env'));
  }

  const ctx = await authenticate(req);
  if (!ctx) {
    return jsonResp(401, rpcError(null, -32001, 'Unauthorized: invalid or missing ChainWork API key'));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResp(400, rpcError(null, -32700, 'Parse error'));
  }

  if (Array.isArray(body)) {
    const out: unknown[] = [];
    for (const m of body) {
      const r = await handleRpc(m, ctx);
      if (r) out.push(r);
    }
    return out.length ? jsonResp(200, out) : new Response(null, { status: 202, headers: CORS });
  }

  const r = await handleRpc(body, ctx);
  return r ? jsonResp(200, r) : new Response(null, { status: 202, headers: CORS });
});
