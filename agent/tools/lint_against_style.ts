import { defineTool } from "eve/tools";
import { z } from "zod";
import blueskyBannedWords from "../skills/bluesky-style/references/banned-words.json" with {
  type: "json",
};
import linkedinBannedWords from "../skills/linkedin-style/references/banned-words.json" with {
  type: "json",
};
import mastodonBannedWords from "../skills/mastodon-style/references/banned-words.json" with {
  type: "json",
};
import threadsBannedWords from "../skills/threads-style/references/banned-words.json" with {
  type: "json",
};
import xBannedWords from "../skills/x-style/references/banned-words.json" with {
  type: "json",
};

/**
 * Escape regular-expression metacharacters so a banned word is matched literally.
 *
 * @remarks
 * Banned words are read from a JSON file and interpolated into a `RegExp`. Without escaping,
 * an entry containing metacharacters could raise a syntax error or, worse, a
 * catastrophic-backtracking pattern (ReDoS) evaluated against caller-supplied `text`.
 * Escaping forces a literal, linear-time match.
 *
 * @param value - Raw banned word.
 * @returns The word with all regex metacharacters backslash-escaped.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive whole-word matcher for one banned entry.
 *
 * @remarks
 * A `\b` boundary is only added at an edge whose character is a word character; `\b` next to
 * punctuation (an entry like `"agree?"`) can never match, so such edges are left unanchored
 * instead of silently disabling the entry.
 *
 * @param value - Raw banned entry.
 * @returns A regex matching the entry literally, bounded where word boundaries exist.
 */
const STARTS_WITH_WORD_CHAR = /^\w/;
const ENDS_WITH_WORD_CHAR = /\w$/;

function toMatcher(value: string): RegExp {
  const leading = STARTS_WITH_WORD_CHAR.test(value) ? "\\b" : "";
  const trailing = ENDS_WITH_WORD_CHAR.test(value) ? "\\b" : "";
  return new RegExp(`${leading}${escapeRegExp(value)}${trailing}`, "i");
}

/**
 * Maximum draft length accepted, in characters.
 *
 * @remarks
 * Bounds the work done per call and the size of accepted input. Comfortably larger than any
 * realistic draft for the supported surfaces.
 */
const MAX_TEXT_LENGTH = 100_000;

/**
 * Schema for a `banned-words.json` file: a flat array of strings.
 *
 * @remarks
 * Parsed content that does not match (a non-array, or non-string elements) is rejected and
 * treated as an empty list rather than trusted.
 */
const BANNED_WORDS_SCHEMA = z.array(z.string());
const BANNED_WORDS_BY_SURFACE = {
  bluesky: blueskyBannedWords,
  linkedin: linkedinBannedWords,
  mastodon: mastodonBannedWords,
  threads: threadsBannedWords,
  x: xBannedWords,
};

/**
 * Tool that checks a draft against the active surface's banned-words list.
 *
 * @remarks
 * The banned-words list lives in each style skill's `references/banned-words.json` and is
 * imported directly so the runtime tool doesn't need a skill file API. The `surface` input is
 * constrained to a fixed enum, so callers can select only one of the bundled lists. Invalid list
 * data is treated as "no banned words" rather than failing the check. Run it before proposing a
 * draft to the writer.
 */
export default defineTool({
  description:
    "Check a draft against the surface's banned-words list and return any violations. " +
    "Run before proposing a draft to the writer.",
  /**
   * Scan `text` for any banned word defined by the surface's style skill.
   *
   * @param input - Validated tool input.
   * @param input.surface - Content surface whose style skill supplies the banned-words list.
   * @param input.text - Draft text to scan.
   * @returns `ok` (true when no banned words are present) and human-readable `violations`.
   */
  execute({ surface, text }) {
    const parsed = BANNED_WORDS_SCHEMA.safeParse(
      BANNED_WORDS_BY_SURFACE[surface]
    );
    const banned = parsed.success
      ? [...new Set(parsed.data.map((word) => word.trim()).filter(Boolean))]
      : [];
    const hits = banned.filter((word) => toMatcher(word).test(text));
    return {
      ok: hits.length === 0,
      violations: hits.map(
        (w) => `Avoid "${w}" per the ${surface} style guide.`
      ),
    };
  },
  inputSchema: z.object({
    surface: z.enum(["x", "linkedin", "threads", "bluesky", "mastodon"]),
    text: z.string().min(1).max(MAX_TEXT_LENGTH),
  }),
});
