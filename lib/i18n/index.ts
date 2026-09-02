// -----------------------------------------------------------------------------
// LANGUAGE RUNTIME
// -----------------------------------------------------------------------------
// Three things have to line up for a warning to actually reach someone:
//   1. the STRINGS, in their language
//   2. the FONT for the script, or they see boxes
//   3. the VOICE tag, or text-to-speech reads Assamese with an English mouth
// Most multilingual builds do (1) and stop. This module does all three, and
// ships only the one script's font that the chosen language needs — which is
// roughly a 90% saving in font bytes over loading a 13-script superfamily, and
// matters on the 2G connection the brief asks us to design for.
// -----------------------------------------------------------------------------

import type { LangCode } from "@/lib/data/districts";
import type { Dict } from "./locales/en";
import en from "./locales/en";

export type { Dict, LangCode };

export type ScriptTag =
  | "latn" | "deva" | "beng" | "taml" | "telu" | "knda" | "mlym"
  | "gujr" | "orya" | "guru" | "arab";

export interface LangMeta {
  code: LangCode;
  /** The language's name IN that language. Never "Hindi" in a Hindi menu. */
  native: string;
  english: string;
  script: ScriptTag;
  dir: "ltr" | "rtl";
  /** BCP-47 tag for SpeechSynthesis and SpeechRecognition. */
  bcp47: string;
  /** Google Fonts family for the script, or null for Latin (already loaded). */
  font: string | null;
  /** Approx. speakers in India, Census 2011, millions. Shown in the picker so
   *  the list is ordered by who is actually excluded, not alphabetically. */
  speakersM: number;
}

export const LANGS: LangMeta[] = [
  { code: "hi", native: "हिन्दी",     english: "Hindi",     script: "deva", dir: "ltr", bcp47: "hi-IN", font: "Noto Sans Devanagari", speakersM: 528 },
  { code: "bn", native: "বাংলা",      english: "Bengali",   script: "beng", dir: "ltr", bcp47: "bn-IN", font: "Noto Sans Bengali",    speakersM: 97 },
  { code: "mr", native: "मराठी",      english: "Marathi",   script: "deva", dir: "ltr", bcp47: "mr-IN", font: "Noto Sans Devanagari", speakersM: 83 },
  { code: "te", native: "తెలుగు",     english: "Telugu",    script: "telu", dir: "ltr", bcp47: "te-IN", font: "Noto Sans Telugu",     speakersM: 81 },
  { code: "ta", native: "தமிழ்",      english: "Tamil",     script: "taml", dir: "ltr", bcp47: "ta-IN", font: "Noto Sans Tamil",      speakersM: 69 },
  { code: "gu", native: "ગુજરાતી",    english: "Gujarati",  script: "gujr", dir: "ltr", bcp47: "gu-IN", font: "Noto Sans Gujarati",   speakersM: 55 },
  { code: "ur", native: "اردو",       english: "Urdu",      script: "arab", dir: "rtl", bcp47: "ur-IN", font: "Noto Nastaliq Urdu",   speakersM: 51 },
  { code: "kn", native: "ಕನ್ನಡ",      english: "Kannada",   script: "knda", dir: "ltr", bcp47: "kn-IN", font: "Noto Sans Kannada",    speakersM: 44 },
  { code: "or", native: "ଓଡ଼ିଆ",       english: "Odia",      script: "orya", dir: "ltr", bcp47: "or-IN", font: "Noto Sans Oriya",      speakersM: 38 },
  { code: "ml", native: "മലയാളം",     english: "Malayalam", script: "mlym", dir: "ltr", bcp47: "ml-IN", font: "Noto Sans Malayalam",  speakersM: 35 },
  { code: "pa", native: "ਪੰਜਾਬੀ",      english: "Punjabi",   script: "guru", dir: "ltr", bcp47: "pa-IN", font: "Noto Sans Gurmukhi",   speakersM: 33 },
  { code: "as", native: "অসমীয়া",     english: "Assamese",  script: "beng", dir: "ltr", bcp47: "as-IN", font: "Noto Sans Bengali",    speakersM: 15 },
  { code: "en", native: "English",    english: "English",   script: "latn", dir: "ltr", bcp47: "en-IN", font: null,                   speakersM: 129 },
];

export const LANG_BY_CODE = Object.fromEntries(LANGS.map((l) => [l.code, l])) as Record<LangCode, LangMeta>;

/** Combined first-language speakers of everything this prototype supports
 *  beyond what the upstream bulletin offers. Used to state the gap as a number. */
export const COVERED_BEYOND_UPSTREAM_M = LANGS
  .filter((l) => l.code !== "en" && l.code !== "hi")
  .reduce((n, l) => n + l.speakersM, 0);

/** Code-split: each locale is its own chunk, fetched only when selected.
 *  English is bundled because it is the fallback and must never fail to load. */
const LOADERS: Record<LangCode, () => Promise<{ default: Dict }>> = {
  en: async () => ({ default: en }),
  hi: () => import("./locales/hi"),
  bn: () => import("./locales/bn"),
  as: () => import("./locales/as"),
  or: () => import("./locales/or"),
  ta: () => import("./locales/ta"),
  te: () => import("./locales/te"),
  kn: () => import("./locales/kn"),
  ml: () => import("./locales/ml"),
  mr: () => import("./locales/mr"),
  gu: () => import("./locales/gu"),
  pa: () => import("./locales/pa"),
  ur: () => import("./locales/ur"),
};

const cache = new Map<LangCode, Dict>([["en", en]]);

export async function loadDict(code: LangCode): Promise<Dict> {
  const hit = cache.get(code);
  if (hit) return hit;
  try {
    const mod = await LOADERS[code]();
    cache.set(code, mod.default);
    return mod.default;
  } catch {
    // A failed chunk fetch must never leave a warning screen blank. English is
    // always in the main bundle, so this fallback cannot itself fail.
    return en;
  }
}

export function dictSync(code: LangCode): Dict {
  return cache.get(code) ?? en;
}

/** Inject the one script font we need, once. Non-blocking: the page renders in
 *  the system fallback and reflows when the face arrives, which is the correct
 *  trade when the alternative is a blank screen on a slow connection. */
export function ensureFont(meta: LangMeta) {
  if (typeof document === "undefined" || !meta.font) return;
  const id = `font-${meta.script}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${meta.font.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// -----------------------------------------------------------------------------
// Shared constants used by both the UI and app/how-it-runs.
// -----------------------------------------------------------------------------

/** Combined first-language reach of every language this prototype speaks,
 *  in millions (Census 2011). The point of the number is the comparison:
 *  the upstream bulletin reaches two of these languages. */
export const TOTAL_SPEAKERS_M = LANGS.reduce((n, l) => n + l.speakersM, 0);

/** Languages the real upstream systems issue in. Sachet and IMD bulletins are
 *  published in English and Hindi. Everything this product does downstream of
 *  that is an attempt to close the difference. */
export const UPSTREAM_LANGUAGES: LangCode[] = ["en", "hi"];
