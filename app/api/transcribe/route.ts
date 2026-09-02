import { NextRequest, NextResponse } from "next/server";
import { openai, TRANSCRIBE_MODEL, hasKey, withTimeout } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

// -----------------------------------------------------------------------------
// Speech in, text out. The reason this route exists rather than relying only on
// the browser's built-in SpeechRecognition:
//
//   - The Web Speech API supports a handful of Indian languages well and the
//     rest badly or not at all. Assamese and Odia are effectively absent.
//   - It is Chrome-shaped. On the mid-range Android browsers this build is
//     designed for, it is inconsistent.
//   - It cannot auto-detect the language. Whisper can, which matters when the
//     person holding the phone did not choose the language setting themselves.
//
// The browser path is still used as an instant, zero-cost first try; this route
// is the fallback when the browser has no engine for the language, and the
// primary when the language is unknown. Both paths are labelled in the UI.
// -----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!hasKey()) return NextResponse.json({ text: "", source: "unavailable" });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad form" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) return NextResponse.json({ error: "no audio" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "too large" }, { status: 413 });

  const langHint = String(form.get("lang") ?? "").slice(0, 5);
  const ai = openai()!;

  const res = await withTimeout(
    ai.audio.transcriptions.create({
      file,
      model: TRANSCRIBE_MODEL,
      // A hint, not a constraint: if the speaker uses a different language the
      // model is free to follow them, which is the point.
      ...(langHint && langHint !== "en" ? { language: langHint.slice(0, 2) } : {}),
      prompt: "Disaster warning, flood, cyclone, shelter, evacuation, helpline.",
    }),
    20000,
  );

  if (!res) return NextResponse.json({ text: "", source: "timeout" });
  return NextResponse.json({
    text: (res as { text?: string }).text ?? "",
    source: "whisper",
    model: TRANSCRIBE_MODEL,
  });
}
