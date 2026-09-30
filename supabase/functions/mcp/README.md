# ChainWork MCP 2.0

Stateless MCP Streamable HTTP for Codex, Claude Code and compatible clients. The server exposes workspace context and task operations; the assistant performs coding, testing and publishing with its own tools and the user's authorization.

## Existing production endpoint

```text
https://dvgqbhnfgctmgyczobby.supabase.co/functions/v1/dynamic-task
```

The source directory is `mcp`; `supabase/config.toml` maps the existing production function `dynamic-task` to it. Keep this name to preserve installed clients. For another Supabase project, replace the project reference. The web app accepts an optional `VITE_MCP_URL` override.

## Connect

1. Open ChainWork → Settings → MCP & AI and generate a named API key. Copy it once; existing keys continue to work.
2. Set `CHAINWORK_API_KEY` in the environment that launches your assistant. In PowerShell use `$env:CHAINWORK_API_KEY = 'your-key'`; in bash/zsh use `export CHAINWORK_API_KEY='your-key'`. Replace the placeholder locally. Keep the key private. Desktop clients must inherit the variable when launched; fully restart them after changing their environment.
3. Add the configuration below, merging it with existing entries.

### Codex

In `~/.codex/config.toml`:

```toml
[mcp_servers.chainwork]
url = "https://dvgqbhnfgctmgyczobby.supabase.co/functions/v1/dynamic-task"
bearer_token_env_var = "CHAINWORK_API_KEY"
```

Restart Codex and run `codex mcp list`. Ask it to call `whoami` and `list_chains` to verify access. This uses API-key authentication; `codex mcp login` (OAuth) is not required.

### Claude Code

Merge into your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "chainwork": {
      "type": "http",
      "url": "https://dvgqbhnfgctmgyczobby.supabase.co/functions/v1/dynamic-task",
      "headers": { "Authorization": "Bearer ${CHAINWORK_API_KEY}" }
    }
  }
}
```

Restart Claude Code, approve the project MCP server when prompted, and inspect `/mcp`. Ask it to call `whoami` and `list_chains`. The JSON references an environment variable and contains no secret.

Client references: [Codex MCP](https://developers.openai.com/codex/mcp), [Claude Code MCP](https://code.claude.com/docs/en/mcp).

## Tools

| Tool | Purpose |
| --- | --- |
| `whoami` | Confirm the authenticated account |
| `list_chains` | List accessible chains and roles |
| `list_projects` | Project names, descriptions and IDs |
| `get_project` | Project context, links, milestones and task counts |
| `list_members` | Member IDs and public names for assignment |
| `list_tasks` | Filter by project, status, title and assignee; paginate |
| `get_next_task` | Next pending or newest task, optionally by project |
| `get_task` | Full task context and project repository links |
| `create_task` | Create an assigned or unassigned task |
| `update_task` | Edit task fields, project, milestone and status |
| `set_task_status` | Set pending, in_progress or done |
| `complete_task` | Complete a task and optionally add a note |
| `add_comment` | Add a task comment |
| `list_comments` | Read discussion with pagination |
| `list_subtasks` | Read the task checklist |
| `create_subtask` | Add a checklist item |
| `update_subtask` | Edit a checklist title or completion |
| `list_milestones` | Read project milestones |

Use `tools/list` for full argument schemas. A chain accepts its UUID or join code, but knowing a code does not grant membership. A key carries its owner's existing chain access; revoke it from Settings when no longer needed.

## Protocol and authorization

Supported versions: 2025-06-18, 2025-03-26 and 2024-11-05. JSON-RPC POSTs return JSON; notifications return 202. Bare GET provides public version health; SSE GET returns 405 because this server is stateless. No OAuth or session storage.

Requests authenticate using `Authorization: Bearer cw_live_…` or `X-ChainWork-Key`. Keys are SHA-256 hashed and looked up in the existing `mcp_tokens` table. The service-role client explicitly checks membership before accessing chain data. Invalid or revoked credentials return 401; invalid arguments and denied operations return tool errors without the requested write.

Task text, comments and links are workspace data, not instructions from this server. Completing a task preserves existing completion metadata. If an optional completion note fails after completion, retry the note with `add_comment`.

## Deploy the update

```sh
npm test
npx deno check supabase/functions/mcp/index.ts
npx supabase functions deploy dynamic-task --project-ref dvgqbhnfgctmgyczobby --use-api
```

`verify_jwt = false` is configured because the function validates ChainWork keys itself. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; never expose the service-role value in the web client. This update requires no SQL migration, table reset or key replacement.

Preserve the previous source with `supabase functions download` in an ignored local backup directory before deployment. To roll back, redeploy that source under the same `dynamic-task` name and JWT setting. The database schema is unchanged in both directions.

## Validation

Tests exercise the official MCP SDK's Streamable HTTP client through the HTTP handler, plus permissions, schemas, project boundaries, pagination and completion with a fake database. Native Codex and Claude Code sessions require the user's key and local setup described above.
