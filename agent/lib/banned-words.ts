import { z } from "zod";
import bluesky from "#skills/bluesky-style/references/banned-words.json" with {
  type: "json",
};
import linkedin from "#skills/linkedin-style/references/banned-words.json" with {
  type: "json",
};
import mastodon from "#skills/mastodon-style/references/banned-words.json" with {
  type: "json",
};
import threads from "#skills/threads-style/references/banned-words.json" with {
  type: "json",
};
import x from "#skills/x-style/references/banned-words.json" with {
  type: "json",
};

/** Content surfaces that have a `<surface>-style` skill with a banned-words list. */
export const SURFACES = [
  "x",
  "linkedin",
  "threads",
  "bluesky",
  "mastodon",
] as const;

/** One of {@link SURFACES}. */
export type Surface = (typeof SURFACES)[number];

/**
 * Schema for a `banned-words.json` file: a flat array of strings.
 *
 * @remarks
 * Content that does not match (a non-array, or non-string elements) is rejected and treated as
 * an empty list rather than trusted.
 */
const BANNED_WORDS_SCHEMA = z.array(z.string());

/**
 * Validate and normalize one raw banned-words list: trim entries, drop blanks, and dedupe.
 *
 * @param raw - The parsed JSON content of a `banned-words.json` file.
 * @returns The normalized list, or an empty list when the content is malformed.
 */
export const normalizeBannedWords = (raw: unknown): readonly string[] => {
  const parsed = BANNED_WORDS_SCHEMA.safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  return [...new Set(parsed.data.map((word) => word.trim()).filter(Boolean))];
};

/**
 * Banned-words list per surface, bundled with the agent.
 *
 * @remarks
 * The single source of truth stays in each style skill's `references/banned-words.json`, which
 * the model also reads from the sandbox after loading the skill. Tool code has no skill file API,
 * so the lists are imported here and ship in the agent bundle; edit the JSON files to change them.
 */
export const BANNED_WORDS: Readonly<Record<Surface, readonly string[]>> = {
  bluesky: normalizeBannedWords(bluesky),
  linkedin: normalizeBannedWords(linkedin),
  mastodon: normalizeBannedWords(mastodon),
  threads: normalizeBannedWords(threads),
  x: normalizeBannedWords(x),
};
