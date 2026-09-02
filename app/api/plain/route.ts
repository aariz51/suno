import { NextRequest, NextResponse } from "next/server";
import { openai, ANSWER_MODEL, hasKey, withTimeout } from "@/lib/openai";
import { guard } from "@/lib/guard";
import { PLANS, PLAN_BY_HAZARD } from "@/lib/data/plans";
import { HELPLINES } from "@/lib/data/helplines";
import { LANG_BY_CODE } from "@/lib/i18n";
import type { LangCode, HazardType } from "@/lib/data/districts";

export const runtime = "nodejs";
export const maxDuration = 25;

// -----------------------------------------------------------------------------
// BULLETIN -> ACTION LIST
//
// A real IMD or CWC bulletin is written for a district magistrate, not for the
// person standing in the water. "River Dhansiri at Numaligarh gauge reading
// 79.42 m against a danger level of 78.60 m, rising at 11 cm/hr" is precise,
// correct, and tells a farmer nothing about what to do in the next hour.
//
// This route turns that register into an ordered list of actions. It is the
// clearest case in the product for a language model, because the input is
// arbitrary free text from an upstream agency that no rule table can enumerate.
//
// It is still not trusted. A deterministic classifier reads the bulletin for a
// known hazard type FIRST; if it finds one, the action list comes from the
// hand-written plan in lib/data/plans.ts and the model is never called. The
// model runs only on text that matches no known hazard, and its output goes
// through the same guard as every other model call: no invented numbers, no
// invented measurements, no verdicts.
// -----------------------------------------------------------------------------

/** Deterministic hazard detection. Deliberately blunt and deliberately first. */
const HAZARD_WORDS: Record<HazardType, string[]> = {
  flood: ["flood", "river", "danger level", "danger mark", "inundat", "embankment", "water level", "discharge", "cumec", "gauge"],
  "urban-flood": ["waterlog", "urban flood", "storm water", "drain"],
  cyclone: ["cyclone", "landfall", "storm surge", "depression", "gale", "sea condition", "fishermen"],
  earthquake: ["earthquake", "seismic", "magnitude", "aftershock", "tremor", "epicent"],
  landslide: ["landslide", "slope", "debris flow", "rockfall", "slip"],
  heatwave: ["heat wave", "heatwave", "maximum temperature", "departure", "heat index"],
  thunderstorm: ["thunderstorm", "lightning", "squall", "gusty", "hail"],
  drought: ["drought", "deficien", "rainfall deficit", "reservoir"],
  wildfire: ["forest fire", "wildfire", "burning"],
  coldwave: ["cold wave", "coldwave", "minimum temperature", "frost"],
};

function detectHazard(text: string): HazardType | null {
  const t = text.toLowerCase();
  let best: HazardType | null = null;
  let bestScore = 0;
  for (const [h, words] of Object.entries(HAZARD_WORDS) as [HazardType, string[]][]) {
    let score = 0;
    for (const w of words) if (t.includes(w)) score += w.length;
    if (score > bestScore) {
      bestScore = score;
      best = h;
    }
  }
  return bestScore >= 5 ? best : null;
}

const SYSTEM = `You convert an official Indian weather or hazard bulletin into
instructions a frightened person can follow.

You will be given BULLETIN text and a list of permitted helpline numbers.

Write:
- "answer": at most three short sentences saying what is happening, in plain
  words. No technical register. No agency names unless they are in the bulletin.
- "action_steps": ordered actions, most urgent first. One action per line.
  Imperative, present tense, no clause before the verb. At most six.
- "avoid": the mistakes that get people killed in this specific situation. Each
  line starts with "Do not". At most four.
- "helplines": only numbers from the permitted list.

Hard rules:
- Every measurement, depth, height, speed, temperature or time you write MUST
  appear verbatim in the bulletin. Do not convert units. Do not round. Do not
  estimate. If the bulletin gives no number, give no number.
- Never output a phone number outside the permitted list.
- Never say the person is safe, that the danger has passed, or that the warning
  has ended.
- Never invent a place, a shelter, or an agency.
- Reading level: a person who left school at 14.

Reply as JSON only:
{"answer": string, "action_steps": string[], "avoid": string[], "helplines": string[], "language": string}`;

export async function POST(req: NextRequest) {
  let body: { bulletin?: string; lang?: LangCode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const bulletin = (body.bulletin ?? "").slice(0, 4000).trim();
  const lang = (body.lang ?? "en") as LangCode;
  if (bulletin.length < 20) return NextResponse.json({ error: "bulletin too short" }, { status: 400 });

  // ---- PATH 1: known hazard, hand-written plan, no model call. -------------
  const hazard = detectHazard(bulletin);
  if (hazard) {
    const plan = PLAN_BY_HAZARD[hazard] ?? PLANS[0];
    return NextResponse.json({
      source: "rules",
      hazard,
      answer: plan.premise,
      action_steps: plan.during,
      avoid: plan.avoid,
      helplines: HELPLINES.filter((h) => h.primary).map((h) => h.number),
      needsTranslation: lang !== "en",
    });
  }

  // ---- PATH 2: unrecognised hazard, model, then guard. ---------------------
  if (!hasKey()) {
    return NextResponse.json({
      source: "unavailable",
      hazard: null,
      answer: "",
      action_steps: [],
      avoid: [],
      helplines: ["1077", "1078"],
    });
  }

  const permitted = HELPLINES.map((h) => `${h.number} (${h.name})`).join(", ");
  const langName = LANG_BY_CODE[lang]?.english ?? "English";
  const ai = openai()!;

  const completion = await withTimeout(
    ai.chat.completions.create({
      model: ANSWER_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Write in ${langName}.\n\nPERMITTED HELPLINES: ${permitted}\n\nBULLETIN:\n${bulletin}`,
        },
      ],
    }),
  );

  if (!completion) {
    return NextResponse.json({
      source: "unavailable",
      hazard: null,
      answer: "",
      action_steps: [],
      avoid: [],
      helplines: ["1077", "1078"],
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    parsed = {};
  }

  // The bulletin itself is the corpus: every quantity in the output must be in it.
  const checked = guard(parsed, bulletin + " " + permitted);
  if (!checked.ok) {
    return NextResponse.json({
      source: "rejected",
      hazard: null,
      answer: "",
      action_steps: [],
      avoid: [],
      helplines: ["1077", "1078"],
      rejectedBecause: checked.reason,
    });
  }

  return NextResponse.json({
    source: "model",
    hazard: null,
    ...checked.value,
    model: ANSWER_MODEL,
  });
}
