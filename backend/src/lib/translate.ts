import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "./env";

const ARABIC_RE = /[؀-ۿݐ-ݿ]/;

export function isArabicText(text: string): boolean {
  return ARABIC_RE.test(text);
}

// Anthropic client is optional, same convention as getResendClient in
// email.ts — skip translation (log only) rather than fail the caller when
// the key isn't configured.
function getClient(env: Env): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT =
  "You translate short e-commerce product copy between English and Arabic. " +
  "Reply with ONLY the translation — no preamble, no quotes, no explanation.";

export async function translateText(
  env: Env,
  text: string,
  targetLang: "ar" | "en",
): Promise<string | null> {
  const client = getClient(env);
  if (!client) {
    console.log("[translate] ANTHROPIC_API_KEY not set, skipping translation");
    return null;
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Translate to ${targetLang === "ar" ? "Arabic" : "English"}:\n\n${text}`,
        },
      ],
    });

    const block = message.content.find((b) => b.type === "text");
    const translated = block && "text" in block ? block.text.trim() : "";
    return translated || null;
  } catch (err) {
    console.error("[translate] request failed:", err);
    return null;
  }
}

/**
 * Given ONE string an admin typed (in whichever language they picked),
 * detects the language, keeps it verbatim on that side, and fills the other
 * side via translateText — best-effort, never throws.
 *
 * `fallbackToSourceIfBlocked` is for NOT NULL English columns (product
 * name/description, variant label): if translation is unavailable or fails
 * while the source was Arabic, the English side falls back to a verbatim
 * copy of the Arabic text rather than being left empty. Nullable Arabic-only
 * columns (the default) simply stay null on failure, matching the existing
 * "Arabic translation is optional" behavior.
 */
export async function resolveBilingualField(
  env: Env,
  input: string,
  { fallbackToSourceIfBlocked = false }: { fallbackToSourceIfBlocked?: boolean } = {},
): Promise<{ en: string; ar: string | null }> {
  const trimmed = input.trim();
  if (!trimmed) return { en: "", ar: null };

  if (isArabicText(trimmed)) {
    const en = await translateText(env, trimmed, "en");
    return { en: en ?? (fallbackToSourceIfBlocked ? trimmed : ""), ar: trimmed };
  }

  const ar = await translateText(env, trimmed, "ar");
  return { en: trimmed, ar };
}
