import { defineWorkflowTool } from "eve/tools";
import { z } from "zod";

const REVIEWER_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    issues: {
      description:
        "One entry per concrete problem; empty when the verdict is 'ready'.",
      items: {
        additionalProperties: false,
        properties: {
          fix: { description: "A concrete suggested change.", type: "string" },
          quote: {
            description: "The offending excerpt, quoted from the draft.",
            type: "string",
          },
          rule: {
            description: "The rubric rule or reference the excerpt breaks.",
            type: "string",
          },
          severity: { enum: ["high", "medium", "low"], type: "string" },
        },
        required: ["severity", "rule", "quote", "fix"],
        type: "object",
      },
      type: "array",
    },
    verdict: {
      description:
        "'ready' = clean enough to send as-is; 'revise' = fix the issues first.",
      enum: ["ready", "revise"],
      type: "string",
    },
  },
  required: ["verdict", "issues"],
  type: "object",
} as const;

export default defineWorkflowTool({
  description:
    "Review a finished social post or thread draft with fresh context against the " +
    "writing-quality rubric. Return a ready or revise verdict with concrete issues. The caller " +
    "passes the full draft plus target platform and voice or audience context in the message.",
  async execute({ message }, ctx) {
    "use workflow";
    const response = await ctx.agent("reviewer").send(message, {
      outputSchema: REVIEWER_OUTPUT_SCHEMA,
      signal: ctx.abortSignal,
    });
    const result = await response.result();
    if (result.status !== "completed" || result.data === undefined) {
      throw new Error(
        result.error?.message ?? "The reviewer did not complete."
      );
    }
    return result.data;
  },
  inputSchema: z.object({ message: z.string() }),
});
