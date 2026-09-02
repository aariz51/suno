// -----------------------------------------------------------------------------
// POST /api/ask — the assistant.
// -----------------------------------------------------------------------------
// The order of operations IS the product. Stated once, plainly, because it is
// also the sentence the submission has to be able to say:
//
//   The model does exactly one job: it answers a question the rule table did not
//   recognise, using only the warnings and guidance already on this page, in the
//   language it was asked in. It may never invent a phone number, a shelter, a
//   measurement or a time; it may never decide whether a person is safe; and it
//   may never originate an evacuation order. Twenty known questions are matched
//   by a deterministic table first, so identical input always returns an
//   identical answer. Only unmatched text reaches the model, and the reply is
//   validated into a fixed schema before anyone sees it. With no key the app
//   falls back to the table and labels on screen which of the two answered.
//
// Every response carries `source`, which the UI renders as a visible chip.
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { answerFromRules, classify, buildGrounding, RULES_VERSION } from "@/lib/rules";
import { localAnswer, fromRuleLines, type Answer } from "@/lib/answer";
import { guard } from "@/lib/guard";
import { loadDict, LANG_BY_CODE } from "@/lib/i18n";
import type { LangCode } from "@/lib/data/districts";
import { DISTRICT_BY_ID, DEFAULT_DISTRICT_ID } from "@/lib/data/districts";
import { ALLOWED_NUMBERS } from "@/lib/data/helplines";
import { hasKey, openai, ANSWER_MODEL, FAST_MODEL, withTimeout } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 25;

const SYSTEM = `You are the answering component of Suno, a disaster-warning prototype for India.

YOUR ONE JOB: answer the question using ONLY the JSON context supplied, in the language named by "replyLanguage".

ABSOLUTE RULES — breaking any one makes the answer unusable:
1. Never state a phone number that is not in context.helplines.
2. Never name a shelter, place, road, river or building that is not in the context.
3. Never state a measurement, level, speed, temperature or time that is not in the context.
4. Never tell the user they are safe, or that they are not. You do not decide that.
5. Never say help has been sent, dispatched or alerted. Nothing you do sends anyone.
6. Never originate an evacuation order. You may only relay one already in context.alerts.
7. If the context does not contain the answer, say so plainly. That is a correct answer.

STYLE — this is read aloud to someone frightened, on a bad connection, who may not read well:
- Short sentences. One instruction each. Imperative mood.
- Concrete nouns: "Aadhaar card", not "documents".
- Write "do not", never "don't" — speech synthesis loses the contraction.
- No preamble and no apology. Start with the answer.
- At most 3 sentences in "answer"; at most 4 items in "action_steps".

Reply with ONLY this JSON, no markdown fence:
{"answer": string, "action_steps": string[], "avoid": string[], "helplines": string[]}`;

/** Translates grounded English rule-table lines into the reader's language.
 *  Guarded structurally: the batch is discarded unless the line count matches
 *  and every helpline number survives unchanged. A rejected batch falls back to
 *  the English original, which is worse to read but never wrong. */
async function translateLines(lines: string[], lang: LangCode): Promise<string[] | null> {
  if (lang === "en" || !lines.length || !hasKey()) return null;
  const meta = LANG_BY_CODE[lang];
  if (!meta) return null;

  const numbersIn = (s: string) =>
    (s.match(/\b\d{3,5}\b|\b\d{10}\b/g) ?? []).filter((n) => ALLOWED_NUMBERS.has(n)).sort().join(",");

  const completion = await withTimeout(
    openai().chat.completions.create({
      model: FAST_MODEL,
      temperature: 0,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            `Translate each numbered line into ${meta.english} (${meta.native}). ` +
            `Return the same count of numbered lines, nothing else. ` +
            `Keep every digit exactly as written. Do not add, merge, split, explain or omit a line. ` +
            `Use plain words a person who left school at 14 would use. Write the equivalent of "do not", never a contraction.`,
        },
        { role: "user", content: lines.map((l, i) => `${i + 1}. ${l}`).join("\n") },
      ],
    }),
    9000,
  );
  if (!completion) return null;

  const out = (completion.choices[0]?.message?.content ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  if (out.length !== lines.length) return null;
  for (let i = 0; i < lines.length; i++) {
    if (numbersIn(lines[i]) !== numbersIn(out[i])) return null;
  }
  return out;
}

export async function POST(req: Request) {
  let body: { question?: string; districtId?: string; lang?: LangCode; offline?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }

  const question = (body.question ?? "").toString().slice(0, 500).trim();
  const districtId = body.districtId && DISTRICT_BY_ID[body.districtId] ? body.districtId : DEFAULT_DISTRICT_ID;
  const lang = (body.lang ?? "en") as LangCode;
  if (!question) return NextResponse.json({ error: "empty-question" }, { status: 400 });

  const t = await loadDict(lang);

  // ---- 1. Deterministic rule table, always first. --------------------------
  const ruled = answerFromRules(question, districtId);
  if (ruled) {
    // Prefer the hand-translated locale answer when we have one: it needs no
    // network, no key, and no model, and it is already in the reader's script.
    const local = lang === "en" ? null : localAnswer(ruled.intent, districtId, lang, t, false);
    if (local) {
      return NextResponse.json({ answer: local, modelUsed: false, keyPresent: hasKey() });
    }
    // Otherwise translate the grounded English lines, structurally verified.
    const lines = await translateLines(ruled.lines, lang);
    const answer = fromRuleLines(
      ruled.intent,
      lines ?? ruled.lines,
      ruled.avoid,
      ruled.numbers,
      districtId,
      lang,
      Boolean(lines),
    );
    return NextResponse.json({ answer, modelUsed: false, keyPresent: hasKey() });
  }

  // ---- 2. No key: the table says plainly that it does not know. ------------
  if (!hasKey()) {
    const fallback = localAnswer("unknown", districtId, lang, t, true)!;
    return NextResponse.json({ answer: fallback, modelUsed: false, keyPresent: false });
  }

  // ---- 3. The model, on a leash. -------------------------------------------
  const grounding = buildGrounding(districtId);
  const meta = LANG_BY_CODE[lang];

  const completion = await withTimeout(
    openai().chat.completions.create({
      model: ANSWER_MODEL,
      temperature: 0.2,
      max_tokens: 450,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            question,
            replyLanguage: `${meta?.english ?? "English"} (${meta?.native ?? "English"})`,
            context: grounding,
          }),
        },
      ],
    }),
    14000,
  );

  const unknown = () => localAnswer("unknown", districtId, lang, t, true)!;

  if (!completion) {
    return NextResponse.json({ answer: unknown(), modelUsed: false, keyPresent: true, error: "model-timeout" });
  }

  let parsed: unknown;
  try { parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}"); } catch { parsed = null; }

  // The corpus the model was given IS the corpus its numbers must come from.
  const corpus = JSON.stringify(grounding);
  const checked = guard(parsed, corpus);

  if (!checked.ok || !checked.value) {
    // Rejected. The reader gets the honest "I do not know", and the reason is
    // returned in the payload so the failure is visible in the demo rather than
    // quietly smoothed over.
    return NextResponse.json({
      answer: unknown(),
      modelUsed: true,
      rejected: checked.reason,
      keyPresent: true,
    });
  }

  const v = checked.value;
  const answer: Answer = {
    text: v.answer,
    steps: v.action_steps,
    avoid: v.avoid,
    source: "model",
    lang,
    intent: classify(question),
    citations: [RULES_VERSION, ...grounding.alerts.map((a) => a.identifier)],
    helplines: v.helplines,
  };
  return NextResponse.json({ answer, modelUsed: true, keyPresent: true, model: ANSWER_MODEL });
}
