import { defineWorkflowTool } from "eve/tools";
import { z } from "zod";

/**
 * Structured result the researcher subagent must return.
 *
 * @remarks
 * Requested per turn through `ctx.agent().send({ outputSchema })`: eve no longer accepts
 * `outputSchema` on `defineAgent`, so this wrapper is what keeps the findings a cited,
 * machine-checkable result the root can act on directly.
 */
const researchResultSchema = z.strictObject({
  findings: z
    .array(
      z.strictObject({
        claim: z
          .string()
          .describe("A single, specific factual claim the draft can rely on."),
        confidence: z
          .enum(["high", "medium", "low"])
          .describe(
            "'high' = multiple strong independent sources; 'low' = single or weaker source."
          ),
        notes: z
          .string()
          .describe(
            "Caveats: date-sensitivity, scope limits, or where sources disagree."
          ),
        sources: z
          .array(
            z.strictObject({
              title: z
                .string()
                .describe("The source's title or publication name."),
              url: z.string().describe("The source URL, as visited."),
            })
          )
          .min(1)
          .describe(
            "The real, fetched sources backing the claim; never empty, never invented."
          ),
      })
    )
    .describe(
      "One entry per verified factual claim; every entry carries at least one real source."
    ),
  gaps: z
    .array(z.string())
    .describe(
      "What could not be found or verified; surfaced to the caller rather than guessed at."
    ),
  summary: z
    .string()
    .describe(
      "A 1-3 sentence synthesis of what the research establishes, for the root to scan first."
    ),
});

/**
 * Model-facing tool that delegates a research question to the `web-researcher` subagent.
 *
 * @remarks
 * The subagent sets `tool: false`, so this workflow tool is the capability the model sees under
 * the name `researcher`. Each call opens a fresh child session with `ctx.agent("web-researcher")`
 * that sees none of this conversation, and requests {@link researchResultSchema} for the turn.
 * The tool returns that structured result as-is, or `{ error }` when the child fails or is
 * cancelled, so the root never mistakes a failed run for "no findings".
 */
export default defineWorkflowTool({
  description:
    "Research a topic on the open web for facts, statistics, primary sources, and links you " +
    "don't already have. A researcher with fresh context runs refined searches against reliable " +
    "sources and returns cited `findings` with confidence levels, a `summary`, and the `gaps` " +
    "it couldn't verify. It does not see this conversation, so put the question, any known " +
    "context, and constraints (recency, region, source type) in `message`.",
  async execute({ message }, ctx) {
    "use workflow";
    const response = await ctx.agent("web-researcher").send(message, {
      outputSchema: researchResultSchema,
      signal: ctx.abortSignal,
    });
    const result = await response.result();
    if (result.status === "failed") {
      return {
        error: result.error?.message ?? "The researcher failed.",
      };
    }
    if (result.data === undefined) {
      return { error: "The researcher stopped before returning findings." };
    }
    return result.data;
  },
  inputSchema: z.object({
    message: z
      .string()
      .min(1)
      .describe(
        "Everything the researcher needs: the specific question, the context you already have, and any constraints."
      ),
  }),
});
