"use client";

// -----------------------------------------------------------------------------
// LIVE TEXT TRANSLATION
// -----------------------------------------------------------------------------
// The UI chrome is hand-translated and static. This hook is for the other half:
// the warning itself, which in a real deployment arrives from the feed in
// English and Hindi and has to reach an Assamese reader within minutes.
//
// Three properties that make this honest rather than decorative:
//
//   CACHED IN THE BROWSER. A translated warning is stored against a hash of its
//   own text, so it survives a reload and, more importantly, survives going
//   offline. A person who read the warning in Odia at 14:32 still has it in Odia
//   at 15:10 with no signal.
//
//   IT NEVER BLOCKS. The original text renders immediately and is replaced when
//   the translation lands. Nobody waits on a network round trip to read an
//   evacuation instruction.
//
//   IT REPORTS ITS OWN PROVENANCE. `source` is surfaced in the UI on every
//   translated block, including when the model was rejected by the validator or
//   was simply unavailable.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import type { LangCode } from "@/lib/data/districts";

export type TSource =
  | "original" | "cache" | "model" | "unavailable" | "rejected" | "pending";

const KEY = "suno.tx.";

function hash(lang: string, lines: string[]) {
  let h = 5381;
  const s = lang + " " + lines.join(" ");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${KEY}${lang}.${(h >>> 0).toString(36)}`;
}

function readCache(k: string): string[] | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function writeCache(k: string, lines: string[]) {
  try {
    localStorage.setItem(k, JSON.stringify(lines));
  } catch {
    /* storage full or blocked: translation still shown for this session */
  }
}

export function useTranslate(lines: string[], lang: LangCode) {
  const [out, setOut] = useState<string[]>(lines);
  const [source, setSource] = useState<TSource>("original");
  const reqId = useRef(0);

  // Serialised so the effect re-runs on content change rather than on array
  // identity, because the caller rebuilds this array on every render.
  const serialised = JSON.stringify(lines);

  useEffect(() => {
    const mine = ++reqId.current;
    const list = JSON.parse(serialised) as string[];

    if (!list.length || lang === "en") {
      setOut(list);
      setSource("original");
      return;
    }

    const k = hash(lang, list);
    const cached = readCache(k);
    if (cached && cached.length === list.length) {
      setOut(cached);
      setSource("cache");
      return;
    }

    // Show the original immediately; upgrade when the translation arrives.
    setOut(list);
    setSource("pending");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSource("unavailable");
      return;
    }

    const ctrl = new AbortController();
    fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines: list, lang }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d: { lines?: string[]; source?: string }) => {
        if (mine !== reqId.current) return;
        const got = d.lines ?? list;
        const src = d.source ?? "unavailable";
        if ((src === "model" || src === "cache") && got.length === list.length) {
          setOut(got);
          setSource("model");
          writeCache(k, got);
        } else if (src === "rejected") {
          setOut(list);
          setSource("rejected");
        } else {
          setOut(list);
          setSource("unavailable");
        }
      })
      .catch(() => {
        if (mine !== reqId.current) return;
        setOut(list);
        setSource("unavailable");
      });

    return () => ctrl.abort();
  }, [serialised, lang]);

  return { lines: out, source };
}

/** The label shown beside any block of live text, so provenance is never
 *  something a reader has to guess at.
 *
 *  It takes the dictionary rather than returning English. These strings used to
 *  be hardcoded, which meant an Urdu reader saw "TRANSLATED BY MODEL" in Latin
 *  script in the middle of their own language — the exact failure this product
 *  is about. */
export function sourceLabel(s: TSource, t?: { [k: string]: string }): string | null {
  const k = (key: string, fallback: string) => (t && t[key]) || fallback;
  switch (s) {
    case "model": return k("translatedByModel", "Translated by model");
    case "cache": return k("translatedSaved", "Translated by model, saved on this device");
    case "pending": return k("translating", "Translating…");
    case "rejected": return k("translationRejected", "Translation rejected by the validator — showing the original");
    case "unavailable": return k("translationUnavailable", "Translation unavailable — showing the original");
    default: return null;
  }
}

// -----------------------------------------------------------------------------
// Compatibility surface.
// -----------------------------------------------------------------------------
// Screens written against the { lines, state } shape use this. Same engine, same
// cache, same validator — it only reports provenance as a coarser three-value
// state rather than the full source enum, because that is all a section header
// needs to render a single badge.
// -----------------------------------------------------------------------------

export type TState = "original" | "translated" | "pending";

export function useTranslateLines(lines: string[], lang: LangCode) {
  const { lines: out, source } = useTranslate(lines, lang);
  const state: TState =
    source === "model" || source === "cache" ? "translated"
    : source === "pending" ? "pending"
    : "original";
  return { lines: out, state, source };
}

/** True only after the first client render. Anything derived from the clock has
 *  to wait for this, or the server's markup and the browser's disagree and React
 *  discards the whole tree — which on this page means the warning flickers. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
