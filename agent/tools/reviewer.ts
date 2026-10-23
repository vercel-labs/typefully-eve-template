import { defineWorkflowTool } from "eve/tools";
import { z } from "zod";

/**
 * Structured verdict the reviewer subagent must return.
 *
 * @remarks
 * Requested per turn through `ctx.agent().send({ outputSchema })`: eve no longer accepts
 * `outputSchema` on `defineAgent`, so this wrapper is what keeps the verdict a structured result
 * the root can act on directly.
 */
const reviewResultSchema = z.strictObject({
  issues: z
    .array(
      z.strictObject({
        fix: z.string().describe("A concrete suggested change."),
        quote: z
          .string()
          .describe("The offending excerpt, quoted from the draft."),
        rule: z
          .string()
          .describe("The rubric rule or reference the excerpt breaks."),
        severity: z.enum(["high", "medium", "low"]),
      })
    )
    .describe(
      "One entry per concrete problem; empty when the verdict is 'ready'."
    ),
  verdict: z
    .enum(["ready", "revise"])
    .describe(
      "'ready' = clean enough to send as-is; 'revise' = fix the issues first."
    ),
});

/**
 * Model-facing tool that delegates a fresh-eyes review of a finished draft to the
 * `draft-reviewer` subagent.
 *
 * @remarks
 * The subagent sets `tool: false`, so this workflow tool is the capability the model sees under
 * the name `reviewer`. Each call opens a fresh child session with `ctx.agent("draft-reviewer")` that
 * never saw the sources or the drafting reasoning, and requests {@link reviewResultSchema} for
 * the turn. The tool returns that verdict as-is, or `{ error }` when the child fails or is
 * cancelled, so a failed review is never mistaken for a clean one.
 */
export default defineWorkflowTool({
  description:
    "Review a finished social post or thread draft with fresh context against the " +
    "writing-quality rubric (AI-tells, plain English, hook, structure, platform fit, voice) " +
    "before it goes to the user. The reviewer does not see this conversation, so put the full " +
    "draft plus the target platform and any voice or audience context in `message`; it loads " +
    "its own rubric and returns a `verdict` with concrete `issues`.",
  async execute({ message }, ctx) {
    "use workflow";
    const response = await ctx.agent("draft-reviewer").send(message, {
      outputSchema: reviewResultSchema,
      signal: ctx.abortSignal,
    });
    const result = await response.result();
    if (result.status === "failed") {
      return { error: result.error?.message ?? "The reviewer failed." };
    }
    if (result.data === undefined) {
      return { error: "The reviewer stopped before returning a verdict." };
    }
    return result.data;
  },
  inputSchema: z.object({
    message: z
      .string()
      .min(1)
      .describe(
        "The full draft, the target platform and its norms that matter for the piece, and any voice or audience context."
      ),
  }),
});
