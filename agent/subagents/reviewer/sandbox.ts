import { defineSandbox } from "eve/sandbox";
import { VercelSandbox } from "eve/sandbox/vercel";

/**
 * Reviewer sandbox configuration.
 *
 * @remarks
 * A subagent's sandbox does not inherit from the root, and the reviewer needs one to read its
 * `writing-quality` skill's seeded reference files. It uses the hosted Vercel Sandbox environment
 * in development and production.
 *
 * @see {@link https://vercel.com/docs/sandbox | Vercel Sandbox}
 */
export const environment = VercelSandbox.environment();

export default defineSandbox(() => environment.open());
