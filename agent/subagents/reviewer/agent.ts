import { defineAgent } from "eve";

/**
 * Fresh-context draft-review subagent.
 *
 * @remarks
 * The root delegates here for a final, unbiased pass over a finished draft before proposing it
 * to the user. The reviewer runs in a fresh child session and inherits none of the root's
 * skills, connections, or tools. Its workflow-tool wrapper requests a structured verdict.
 *
 * @see The review rubric and verdict contract in this folder's `instructions.md`.
 */
export default defineAgent({
  description:
    "Review a finished social post or thread draft with fresh context against the " +
    "writing-quality rubric (AI-tells, plain English, hook, structure, platform fit, voice) " +
    "before it goes to the user. The caller passes the full draft plus the target platform " +
    "and any voice or audience context in the message; the reviewer loads its own rubric " +
    "and returns a verdict with concrete issues.",
  model: "anthropic/claude-fable-5",
  tool: false,
});
