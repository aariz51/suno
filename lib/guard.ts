// -----------------------------------------------------------------------------
// CORPUS GUARD
// -----------------------------------------------------------------------------
// The guard in lib/answer.ts validates an answer against the app's own dataset.
// This one validates against an arbitrary corpus string — the specific bulletin
// that was pasted in — and is used by /api/plain.
//
// The rule it enforces is the one that matters most for bulletin rewriting:
//
//   EVERY QUANTITY IN THE OUTPUT MUST APPEAR IN THE INPUT.
//
// A model asked to simplify "79.42 m against a danger level of 78.60 m" will,
// occasionally, helpfully round, convert, or average. In a flood warning that is
// not a stylistic slip; it is a false measurement presented as an official one.
// So any number in the output that is not in the corpus rejects the whole batch.
// -----------------------------------------------------------------------------

import { ALLOWED_NUMBERS } from "./data/helplines";

export interface CorpusGuardResult {
  ok: boolean;
  reason?: string;
  value?: {
    answer: string;
    action_steps: string[];
    avoid: string[];
    helplines: string[];
    language?: string;
  };
}

/** Any run of digits, optionally with a decimal part. */
const NUM_RE = /\d+(?:\.\d+)?/g;

const FORBIDDEN = [
  "you are safe", "you are now safe", "the danger has passed", "warning has ended",
  "no longer any risk", "help is on the way", "rescue has been sent", "i have alerted",
  "officially confirmed", "government confirms", "guaranteed",
];

function numbersIn(s: string): string[] {
  return (s.match(NUM_RE) ?? []).map((n) => n.replace(/\.0+$/, ""));
}

export function guard(raw: unknown, corpus: string): CorpusGuardResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "not-an-object" };
  const r = raw as Record<string, unknown>;

  const answer = typeof r.answer === "string" ? r.answer.trim() : "";
  if (!answer) return { ok: false, reason: "empty-answer" };
  if (answer.length > 800) return { ok: false, reason: "too-long" };

  const asArr = (v: unknown, cap: number) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, cap)
      : [];

  const action_steps = asArr(r.action_steps, 6);
  const avoid = asArr(r.avoid, 4);
  const helplines = asArr(r.helplines, 6);

  const blob = [answer, ...action_steps, ...avoid].join(" ");
  const lower = blob.toLowerCase();

  // 1 — no verdicts, no all-clears, no claims of dispatch.
  for (const f of FORBIDDEN) {
    if (lower.includes(f)) return { ok: false, reason: `forbidden-claim:${f}` };
  }

  // 2 — every quantity must be traceable to the corpus, or be a real helpline.
  const corpusNums = new Set(numbersIn(corpus));
  for (const n of numbersIn(blob)) {
    if (corpusNums.has(n)) continue;
    if (ALLOWED_NUMBERS.has(n)) continue;
    return { ok: false, reason: `unsourced-number:${n}` };
  }

  // 3 — helplines must be real, and must be numbers we publish.
  for (const h of helplines) {
    const digits = h.replace(/\D/g, "");
    if (!ALLOWED_NUMBERS.has(digits)) return { ok: false, reason: `invented-helpline:${h}` };
  }

  return {
    ok: true,
    value: {
      answer, action_steps, avoid,
      helplines: helplines.map((h) => h.replace(/\D/g, "")),
      language: typeof r.language === "string" ? r.language : undefined,
    },
  };
}
