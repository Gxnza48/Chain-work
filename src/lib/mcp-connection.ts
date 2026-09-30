export function mcpEndpoint(supabaseUrl: string, override?: string): string {
  return (
    override || `${supabaseUrl.replace(/\/$/, "")}/functions/v1/dynamic-task`
  );
}

/** Tokens are supplied by the user through the environment, never embedded in shared config. */
export function connectionSnippet(
  client: "codex" | "claude",
  endpoint: string,
): string {
  if (client === "codex")
    return `[mcp_servers.chainwork]\nurl = ${JSON.stringify(endpoint)}\nbearer_token_env_var = "CHAINWORK_API_KEY"`;
  return JSON.stringify(
    {
      mcpServers: {
        chainwork: {
          type: "http",
          url: endpoint,
          headers: { Authorization: "Bearer ${CHAINWORK_API_KEY}" },
        },
      },
    },
    null,
    2,
  );
}
