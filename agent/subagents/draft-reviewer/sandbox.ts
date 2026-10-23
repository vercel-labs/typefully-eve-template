import { defineSandbox } from "eve/sandbox";
import { VercelSandbox } from "eve/sandbox/vercel";

/**
 * Reviewer sandbox environment.
 *
 * @remarks
 * A subagent's sandbox does not inherit from the root, and the reviewer needs one to read its
 * `writing-quality` skill's seeded reference files. (`defineParentSandbox()` would share the
 * root's sandbox instead, but an inheriting subagent cannot declare its own skill files.) Pins
 * the same hosted Vercel Sandbox provider as the root so the subagent behaves identically in
 * development and production.
 *
 * @see {@link https://vercel.com/docs/sandbox | Vercel Sandbox}
 */
export const environment = VercelSandbox.environment();

/** Opens the reviewer session's persistent Vercel Sandbox. */
export default defineSandbox(() => environment.open());
