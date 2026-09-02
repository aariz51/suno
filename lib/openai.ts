// -----------------------------------------------------------------------------
// OpenAI client. Server-side only — the key never reaches the browser.
// -----------------------------------------------------------------------------
// hasKey() is checked before every model call and surfaced to the UI, because
// "works with no key, and says so" is a property this build claims out loud and
// therefore has to actually hold.
//
// withTimeout() exists because a model call in an emergency product must have a
// deadline. If the answer is not back in time, the rule table answers instead.
// A slow correct answer is a wrong answer when a river is rising.
// -----------------------------------------------------------------------------

import OpenAI from "openai";

let client: OpenAI | null = null;

export function hasKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openai(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // Honouring OPENAI_BASE_URL lets the model path be exercised end to end
      // against a local stub — which is how scripts/model-path.test.mjs proves
      // the guard actually rejects a poisoned completion, without needing a
      // real key or a network. It is also the hook for an enterprise proxy.
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
    });
  }
  return client;
}

/** One place to change models, and one place to read which one is in use. */
export const MODELS = {
  ask: "gpt-4o-mini",
  rewrite: "gpt-4o-mini",
  transcribe: "whisper-1",
} as const;

/** Named aliases used across the API routes. */
export const ANSWER_MODEL = MODELS.ask;
export const FAST_MODEL = MODELS.rewrite;
export const TRANSCRIBE_MODEL = MODELS.transcribe;

/** Resolves to null instead of throwing when the deadline passes, so callers
 *  fall through to their deterministic path rather than showing an error. */
export async function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), ms); }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
