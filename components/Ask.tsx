"use client";

// -----------------------------------------------------------------------------
// ASK
// -----------------------------------------------------------------------------
// The one screen a person can use who cannot read the others: hold the button,
// speak in your own language, get the answer read back in it.
//
// The order of operations is the product, and it is shown on screen every time:
//
//   1. The question hits the DETERMINISTIC RULE TABLE first. Twenty intents,
//      matched by keyword in thirteen languages, answered by assembling text
//      that already exists in the dataset, already in the reader's language.
//      Identical input, identical answer, no model call, no key, no network.
//   2. Only unmatched text reaches the MODEL, grounded on this district's corpus
//      and nothing else.
//   3. What the model returns is VALIDATED. A phone number outside the allowlist,
//      an invented measurement, or any sentence declaring a person safe, and the
//      answer is thrown away rather than repaired.
//
// Every answer carries a chip saying which of those produced it — including,
// deliberately, when the validator rejected the model and why. A judge watching
// the guard fire is worth more than a clean-looking answer that hides it.
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { Btn, Card, Label, Sheet, cx } from "./ui";
import {
  IconBolt, IconInfo, IconMic, IconPhone, IconSend, IconShield, IconSpeaker, IconSpeakerOff,
} from "./icons";
import { LANG_BY_CODE } from "@/lib/i18n";
import { DISTRICT_BY_ID } from "@/lib/data/districts";

/** Mirrors the Answer shape returned by /api/ask. */
type Answer = {
  text: string;
  steps: string[];
  avoid: string[];
  source: "rules" | "rules-translated" | "offline-rules" | "model" | string;
  lang: string;
  intent: string;
  citations: string[];
  helplines: string[];
};

type AskResponse = {
  answer: Answer;
  modelUsed: boolean;
  keyPresent: boolean;
  rejected?: string;
  model?: string;
  error?: string;
};

export function AskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, districtId, speak, stopSpeaking, speaking, ttsAvailable } = useStore();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<AskResponse | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [micState, setMicState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [micNote, setMicNote] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const district = DISTRICT_BY_ID[districtId];
  const meta = LANG_BY_CODE[lang];
  const ans = res?.answer ?? null;

  async function ask(text: string) {
    const question = text.trim();
    if (!question) return;
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, districtId, lang }),
      });
      setRes(await r.json());
    } catch {
      setRes({
        answer: {
          text: "",
          steps: [],
          avoid: [],
          source: "offline-rules",
          lang,
          intent: "unknown",
          citations: [],
          helplines: ["1077", "1078"],
        },
        modelUsed: false,
        keyPresent: false,
      });
    } finally {
      setBusy(false);
    }
  }

  // ---- voice ---------------------------------------------------------------
  // Record and send to Whisper rather than relying on the browser's built-in
  // recogniser as the primary path. The Web Speech API has effectively no engine
  // for Assamese or Odia, which are the languages of two of the districts this
  // build is warning about — so on the exact case that matters, it fails.
  async function startRec() {
    setMicNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        if (blob.size < 1200) { setMicState("idle"); return; }
        setMicState("transcribing");
        const fd = new FormData();
        fd.append("audio", new File([blob], "q.webm", { type: "audio/webm" }));
        fd.append("lang", lang);
        try {
          const r = await fetch("/api/transcribe", { method: "POST", body: fd });
          const d = (await r.json()) as { text?: string; source?: string };
          if (d.text) {
            setHeard(d.text);
            setQ(d.text);
            await ask(d.text);
          } else {
            setMicNote(
              d.source === "unavailable"
                ? "Speech recognition needs an API key. Type the question instead — everything else still works."
                : "Nothing was heard. Try again, or type the question.",
            );
          }
        } catch {
          setMicNote("Could not reach speech recognition. Type the question instead.");
        } finally {
          setMicState("idle");
        }
      };
      recorder.current = mr;
      mr.start();
      setMicState("recording");
    } catch {
      setMicNote("Microphone permission was refused. Type the question instead.");
      setMicState("idle");
    }
  }

  function stopRec() {
    try { recorder.current?.stop(); } catch { /* already stopped */ }
    if (micState === "recording") setMicState("transcribing");
  }

  useEffect(() => {
    if (!open) {
      try { recorder.current?.stop(); } catch { /* ignore */ }
      setMicState("idle");
    }
  }, [open]);

  const spoken = [ans?.text, ...(ans?.steps ?? []), ...(ans?.avoid ?? [])]
    .filter(Boolean)
    .join(". ");
  const speakId = "ask-answer";
  const isSpeaking = speaking === speakId;

  // Read the answer aloud the moment it lands. This is a voice-first surface: a
  // person holding a phone at arm's length in the rain should not have to find
  // a play button.
  useEffect(() => {
    if (!ans || !ttsAvailable || !spoken.trim()) return;
    speak(speakId, spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  const suggestions = [t.q1, t.q2, t.q3, t.q4];

  return (
    <Sheet open={open} onClose={() => { stopSpeaking(); onClose(); }} title={t.askTitle}>
      <p className="-mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">{t.askSub}</p>

      {/* ---- hold to speak ------------------------------------------------ */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onPointerDown={(e) => { e.preventDefault(); if (micState === "idle") void startRec(); }}
          onPointerUp={(e) => { e.preventDefault(); if (micState === "recording") stopRec(); }}
          onPointerLeave={() => { if (micState === "recording") stopRec(); }}
          disabled={micState === "transcribing"}
          aria-label={t.tapToSpeak}
          className={cx(
            "grid h-[88px] w-[88px] place-items-center rounded-full border-2 transition-colors",
            micState === "recording"
              ? "border-transparent bg-[var(--color-l4)] text-white a-pulse"
              : micState === "transcribing"
                ? "border-transparent bg-[var(--color-accent)] text-white"
                : "border-[var(--color-ink)] bg-[var(--color-paper)] text-[var(--color-ink)]",
          )}
        >
          <IconMic size={36} />
        </button>
        <div className="text-[13px] font-bold text-[var(--color-ink-2)]">
          {micState === "recording" ? t.listening
            : micState === "transcribing" ? t.thinking
            : t.tapToSpeak}
        </div>
        <div className="num text-[11.5px] text-[var(--color-ink-3)]">
          {meta?.native} · {meta?.bcp47}
        </div>
        {micNote && (
          <p className="text-center text-[12.5px] font-semibold leading-relaxed text-[var(--color-l3)]">
            {micNote}
          </p>
        )}
      </div>

      {heard && (
        <div className="mt-3 rounded-[10px] bg-[var(--color-paper-2)] px-3 py-2">
          <Label>Heard</Label>
          <div className="mt-0.5 text-[14px] font-semibold">{heard}</div>
        </div>
      )}

      {/* ---- typed input -------------------------------------------------- */}
      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void ask(q)}
          placeholder={t.askPlaceholder}
          aria-label={t.askPlaceholder}
          className="w-full rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper)] px-3.5 py-3 text-[16px] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <Btn
          variant="primary"
          onClick={() => void ask(q)}
          disabled={busy || !q.trim()}
          icon={<IconSend size={18} />}
          aria-label={t.ask}
        >
          <span className="hidden sm:inline">{t.ask}</span>
        </Btn>
      </div>

      <div className="mt-3">
        <Label>{t.suggested}</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => { setQ(sug); void ask(sug); }}
              className="rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* ---- answer ------------------------------------------------------- */}
      {busy && (
        <div className="mt-4 space-y-2" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-11 rounded-[10px] bg-[var(--color-paper-2)]" />
          ))}
        </div>
      )}

      {res && ans && !busy && (
        <div className="mt-4 border-t border-[var(--color-hairline)] pt-4 a-rise" aria-live="polite">
          <SourceChip res={res} />

          {res.rejected && (
            <Card className="mt-3 border-[var(--color-l3)]/30 bg-[var(--color-l3-wash)] p-3.5">
              <div className="flex items-start gap-2.5">
                <IconShield size={20} className="mt-0.5 shrink-0 text-[var(--color-l3)]" />
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[var(--color-l3)]">
                    The validator threw the model&apos;s answer away.
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
                    The model replied, the reply failed a check, and you are not being shown it.
                    Reason: <span className="font-semibold">{res.rejected}</span>. Nothing was
                    repaired or guessed at — that is the point of the check.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {ans.text && <p className="mt-3 text-[17px] font-bold leading-snug">{ans.text}</p>}

          {ans.steps.length > 0 && (
            <ol className="mt-3 space-y-2">
              {ans.steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-[10px] border border-[var(--color-hairline)] p-3">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-ink)] text-[12px] font-extrabold text-[var(--color-paper)]">
                    {i + 1}
                  </span>
                  <span className="text-[15px] font-semibold leading-snug">{s}</span>
                </li>
              ))}
            </ol>
          )}

          {ans.avoid.length > 0 && (
            <>
              <Label className="mt-4 !text-[var(--color-l4)]">{t.whatNotToDo}</Label>
              <ul className="mt-1.5 space-y-1.5">
                {ans.avoid.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-[10px] border border-[var(--color-l4)]/25 bg-[var(--color-l4-wash)] p-3 text-[14px] font-semibold leading-snug"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}

          {ans.helplines.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {ans.helplines.map((h) => (
                <a
                  key={h}
                  href={`tel:${h}`}
                  className="num inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-3.5 text-[14px] font-bold"
                >
                  <IconPhone size={15} /> {h}
                </a>
              ))}
            </div>
          )}

          {ttsAvailable && spoken.trim() && (
            <Btn
              className="mt-3"
              size="sm"
              variant={isSpeaking ? "danger" : "outline"}
              onClick={() => (isSpeaking ? stopSpeaking() : speak(speakId, spoken))}
              icon={isSpeaking ? <IconSpeakerOff size={16} /> : <IconSpeaker size={16} />}
            >
              {isSpeaking ? t.stopListening : t.replay}
            </Btn>
          )}

          {ans.citations.length > 0 && (
            <div className="num mt-3 text-[11px] leading-relaxed text-[var(--color-ink-3)]">
              Grounded on {ans.citations.join(" · ")}
              {res.model ? ` · ${res.model}` : ""}
              {district ? ` · ${district.name}` : ""}
            </div>
          )}
        </div>
      )}

      <Contract keyPresent={res?.keyPresent} />
    </Sheet>
  );
}

// -----------------------------------------------------------------------------

function SourceChip({ res }: { res: AskResponse }) {
  const src = res.rejected ? "rejected" : res.answer.source;

  const map: Record<string, { text: string; tone: string }> = {
    rules: { text: "Rule table — no model call", tone: "safe" },
    "rules-translated": { text: "Rule table, translated by the model", tone: "accent" },
    "offline-rules": { text: "Rule table, offline — no model call", tone: "safe" },
    model: { text: "Language model — passed the validator", tone: "accent" },
    rejected: { text: "Model answer rejected by the validator", tone: "l3" },
  };
  const m = map[src] ?? { text: src, tone: "l1" };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]"
        style={{ background: `var(--color-${m.tone}-wash)`, color: `var(--color-${m.tone})` }}
      >
        <IconBolt size={13} />
        {m.text}
      </span>
      {res.answer.intent && res.answer.intent !== "unknown" && (
        <span className="rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-3)]">
          intent: {res.answer.intent}
        </span>
      )}
      {!res.keyPresent && (
        <span className="rounded-full border border-dashed border-[var(--color-ink-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-3)]">
          no API key configured
        </span>
      )}
    </div>
  );
}

/** The contract, on the screen where the model actually runs — not buried in a
 *  README. Naming the forbidden moves is what makes the permitted one credible. */
function Contract({ keyPresent }: { keyPresent?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 rounded-[11px] border border-dashed border-[var(--color-hairline)] p-3.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <IconInfo size={17} className="shrink-0 text-[var(--color-ink-3)]" />
        <span className="flex-1 text-[13px] font-bold">
          What the model is and is not allowed to do
        </span>
        <span className="text-[var(--color-ink-3)]" aria-hidden>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 a-rise">
          <div>
            <Label>It does exactly two jobs</Label>
            <ul className="mt-1.5 space-y-1 text-[12.5px] leading-relaxed text-[var(--color-ink-2)]">
              <li>
                Translates text a deterministic path has already produced, into the language you
                chose — without adding, dropping or reordering a line.
              </li>
              <li>
                Answers a question the rule table did not recognise, grounded only on this
                district&apos;s warnings, shelters and guidance.
              </li>
            </ul>
          </div>

          <div>
            <Label className="!text-[var(--color-l4)]">It is never allowed to</Label>
            <ul className="mt-1.5 space-y-1 text-[12.5px] leading-relaxed text-[var(--color-ink-2)]">
              <li>Output a phone number that is not in the ten-number allowlist.</li>
              <li>Output a measurement, depth, speed or time that is not in the source text.</li>
              <li>
                Tell you that you are safe, or that a warning has ended. Only the district authority
                can say that.
              </li>
              <li>Reorder the steps of an evacuation instruction.</li>
              <li>Invent a shelter, a place, or an agency.</li>
            </ul>
          </div>

          <GuardDemo />

          <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
            Each of those is enforced by a validator that runs on every reply, not by the prompt
            alone. A reply that breaks one is discarded, and you are told that it was and why.
            {keyPresent === false && (
              <> Right now no API key is configured, so every answer here is coming from the rule
              table — and the app still works, which is the property that was engineered for.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

type GuardCase = {
  id: string; label: string; why: string; offending: string;
  expected: string; outcome: string; reason: string; correct: boolean;
};

/** Watch the guard fire.
 *
 *  Every project in this category claims its model output is validated. This lets
 *  a reviewer see it happen: four deliberately poisoned answers and one correct
 *  one, all pushed through the SAME validator that every live reply goes through,
 *  against this district's real grounding corpus. If the guard were removed these
 *  would start coming back "accepted" and the demo would break in public — which
 *  is what makes it evidence rather than a claim. */
function GuardDemo() {
  const { districtId } = useStore();
  const [rows, setRows] = useState<GuardCase[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const r = await fetch("/api/guard-demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ districtId }),
      });
      const d = await r.json();
      setRows(d.results ?? []);
      setAllCorrect(Boolean(d.allCorrect));
    } catch {
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] p-3">
      <div className="text-[12.5px] font-bold">Watch the validator do it</div>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-3)]">
        Five answers are pushed through the real validator: four that a model might plausibly
        produce and that would hurt someone, and one correct answer as a control.
      </p>

      <Btn size="sm" variant="outline" className="mt-2.5" onClick={run} disabled={busy}>
        {busy ? "Running…" : rows ? "Run again" : "Run the check"}
      </Btn>

      {rows && (
        <div className="mt-3 space-y-2 a-rise">
          {rows.map((c) => {
            const blocked = c.outcome === "rejected";
            const tone = c.correct ? (blocked ? "l4" : "safe") : "l3";
            return (
              <div
                key={c.id}
                className="rounded-[9px] border border-[var(--color-hairline)] bg-[var(--color-paper)] p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12.5px] font-bold leading-snug">{c.label}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em]"
                    style={{ background: `var(--color-${tone}-wash)`, color: `var(--color-${tone})` }}
                  >
                    {blocked ? "blocked" : "allowed"}
                  </span>
                </div>
                <div className="mt-1 border-l-2 border-[var(--color-hairline)] pl-2 text-[11.5px] italic leading-snug text-[var(--color-ink-3)]">
                  &ldquo;{c.offending}&rdquo;
                </div>
                {c.reason && (
                  <div className="num mt-1 text-[11px] font-semibold text-[var(--color-l4)]">
                    {c.reason}
                  </div>
                )}
                <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
                  {c.why}
                </div>
              </div>
            );
          })}
          <div
            className="rounded-[9px] px-2.5 py-2 text-[12px] font-bold"
            style={{
              background: allCorrect ? "var(--color-safe-wash)" : "var(--color-l3-wash)",
              color: allCorrect ? "var(--color-safe)" : "var(--color-l3)",
            }}
          >
            {allCorrect
              ? "The validator behaved exactly as specified on all five."
              : "One or more cases did not behave as specified."}
          </div>
        </div>
      )}
    </div>
  );
}
