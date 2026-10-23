import { defineSandbox } from "eve/sandbox";
import { VercelSandbox } from "eve/sandbox/vercel";

/**
 * Agent sandbox environment.
 *
 * @remarks
 * Pins the hosted Vercel Sandbox provider for both local development and production, so the
 * same environment runs everywhere. Running locally requires the project to be linked and
 * authenticated to Vercel (`eve link`, or `vercel link` plus `vercel env pull`).
 *
 * The environment is exported because `eve build` prepares it (writing the skill files into a
 * snapshot) before any session exists; pass it to `ctx.getSandbox(environment)` from authored
 * code that needs Vercel-specific capabilities such as `setNetworkPolicy()`.
 *
 * @see {@link https://vercel.com/docs/sandbox | Vercel Sandbox}
 */
export const environment = VercelSandbox.environment();

/** Opens the current session's persistent Vercel Sandbox. */
export default defineSandbox(() => environment.open());
