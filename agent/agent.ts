import { defineAgent } from "eve";

/** New (uncached) input tokens a session may spend before eve asks the user to continue. */
const MAX_NEW_INPUT_TOKENS = 500_000;

/** Output tokens a session may spend before eve asks the user to continue. */
const MAX_OUTPUT_TOKENS = 20_000;

/**
 * Root agent runtime configuration.
 *
 * @remarks
 * Sets the model and the session budget for the Typefully social media agent; the rest of the agent's surface
 * (channels, connections, tools, skills, subagents) is discovered from the filesystem under
 * `agent/`. Conversation history is compacted once it reaches 75% of the context window, and the
 * session usage limit caps runaway sessions. Raise the caps if long content work hits them.
 *
 * `sessionUsage` is checked before each model call against the usage `window` since the last
 * approved continuation; when it returns `true`, eve asks the user whether to continue (in Slack,
 * a button), and approving starts a fresh window. Input counts only new tokens: cache reads are
 * the history the provider replays from its prompt cache on every step, so they are subtracted.
 * Subagents without their own `limits` check their own window against this same function.
 */
export default defineAgent({
  compaction: { thresholdPercent: 0.75 },
  limits: {
    sessionUsage: ({ window }) =>
      window.inputTokens - window.cacheReadTokens >= MAX_NEW_INPUT_TOKENS ||
      window.outputTokens >= MAX_OUTPUT_TOKENS,
  },
  model: "anthropic/claude-sonnet-5",
});
