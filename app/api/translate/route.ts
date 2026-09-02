import { NextRequest, NextResponse } from "next/server";
import { openai, FAST_MODEL, hasKey, withTimeout } from "@/lib/openai";
import { LANG_BY_CODE } from "@/lib/i18n";
import type { LangCode } from "@/lib/data/districts";
import { ALLOWED_NUMBERS } from "@/lib/data/helplines";

export const runtime = "nodejs";
export const maxDuration = 25;

// -----------------------------------------------------------------------------
// JOB 1 - TRANSLATE.
//
// The UI chrome is hand-translated and shipped as static files. This route
// exists for the part that cannot be: the live warning text, which in a real
// deployment arrives from a CAP feed in English and Hindi and has to reach a
// reader in Assamese or Odia within minutes of being issued.
//
// The model is given text and a target language and nothing else. It is not told
// what the text is for, not asked to summarise it, and not permitted to change
// its structure. Output is checked line-for-line: the translation must have the
// same number of segments as the input, and must not have introduced or lost a
// helpline number.
//
// Results are cached in-process by content hash, so a district's warning is
// translated once per language per revision rather than once per reader.
// -----------------------------------------------------------------------------

const cache = new Map<string, string[]>();
const MAX_CACHE = 500;

function key(lang: string, lines: string[]) {
  let h = 0;
  const s = lang + " " + lines.join("");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${lang}:${h}:${lines.length}`;
}

const SYSTEM = `You are a translation engine for emergency warnings in India.

Translate each numbered line into the target language. Rules, all mandatory:
- Return exactly as many lines as you were given, in the same order.
- Do not merge, split, summarise, expand, explain or reorder lines.
- Do not soften an instruction. "Do not drive" must stay an absolute prohibition.
- Keep every digit, number, unit and phone number exactly as written. Do not
  convert units, localise numerals, or round.
- Keep proper nouns (place names, river names, agency names) as they are, unless
  the target language has a standard established form.
- Use the simplest everyday register of the target language, the way a person
  would speak to a neighbour. Not official or literary register.
- Output nothing but the translated lines, numbered exactly as the input was.`;

export async function POST(req: NextRequest) {
  let body: { lines?: string[]; lang?: LangCode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const lines = (body.lines ?? []).filter((l) => typeof l === "string").slice(0, 40);
  const lang = (body.lang ?? "en") as LangCode;
  if (!lines.length) return NextResponse.json({ lines: [], source: "none" });
  if (lang === "en") return NextResponse.json({ lines, source: "identity" });

  const meta = LANG_BY_CODE[lang];
  if (!meta) return NextResponse.json({ lines, source: "identity" });

  const k = key(lang, lines);
  const hit = cache.get(k);
  if (hit) return NextResponse.json({ lines: hit, source: "cache", model: FAST_MODEL });

  if (!hasKey()) {
    // Honest degradation: the caller shows the original text with a banner
    // saying translation is unavailable, rather than a blank screen.
    return NextResponse.json({ lines, source: "unavailable" });
  }

  const numbered = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
  const ai = openai()!;

  const completion = await withTimeout(
    ai.chat.completions.create({
      model: FAST_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Target language: ${meta.english} (${meta.native}).\n\n${numbered}`,
        },
      ],
    }),
    12000,
  );

  if (!completion) return NextResponse.json({ lines, source: "unavailable" });

  const text = completion.choices[0]?.message?.content ?? "";
  const out = text
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 0);

  // Structural check: same number of segments, or we discard the whole batch.
  if (out.length !== lines.length) {
    return NextResponse.json({
      lines,
      source: "rejected",
      rejectedBecause: "line count mismatch",
    });
  }

  // Number check: the translation may not introduce a helpline that was not in
  // the source, and may not have lost one that was.
  const phones = (s: string) =>
    (s.match(/\b\d{3,5}\b|\b\d{10}\b/g) ?? [])
      .filter((n) => ALLOWED_NUMBERS.has(n))
      .sort()
      .join(",");

  for (let i = 0; i < lines.length; i++) {
    if (phones(lines[i]) !== phones(out[i])) {
      return NextResponse.json({
        lines,
        source: "rejected",
        rejectedBecause: `helpline changed on line ${i + 1}`,
      });
    }
  }

  if (cache.size > MAX_CACHE) cache.clear();
  cache.set(k, out);

  return NextResponse.json({ lines: out, source: "model", model: FAST_MODEL });
}
