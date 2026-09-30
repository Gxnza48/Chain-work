import SiClaude from "@icons-pack/react-simple-icons/icons/SiClaude";

/** Official brand silhouettes from Simple Icons, with accessible adjacent labels. */
export function AgentIcon({
  agent,
  className,
}: {
  agent: "codex" | "claude";
  className?: string;
}) {
  if (agent === "claude")
    return <SiClaude className={className} aria-hidden="true" />;
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        mask: "url(/openai.svg) center / contain no-repeat",
      }}
    />
  );
}
