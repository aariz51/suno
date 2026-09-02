// -----------------------------------------------------------------------------
// THE OFFLINE LANGUAGE BRIDGE
// -----------------------------------------------------------------------------
// lib/rules.ts is the single rule table. It assembles grounded answers in
// English from the CAP alerts, the shelter register and the preparedness plans.
// That is the right place for the logic, and it is not duplicated here.
//
// This file solves the one thing an English rule table cannot: what a person
// reading Assamese gets when there is no network and no key.
//
// The locale files ship hand-translated answer templates for the commonest
// intents. So the fallback ladder, in order, is:
//
//   1. rule table (English, grounded, exact)     — always tried first
//      └─ online  → translated by /api/translate, which verifies line count
//                   and that no helpline number changed
//      └─ offline → localAnswer() below, hand-translated, no network, no key
//   2. model, on a leash, guarded                — only for unmatched questions
//   3. localAnswer("unknown")                    — says plainly it does not know
//
// Nothing here generates text. Every string is either from lib/data or from a
// locale file a human wrote.
// -----------------------------------------------------------------------------

import type { LangCode } from "./data/districts";
import type { Intent } from "./rules";
import { RULES_VERSION } from "./rules";
import { alertsFor, level } from "./data/alerts";
import { sheltersFor } from "./data/shelters";
import { PLAN_VERSION } from "./data/plans";
import type { Dict } from "./i18n";

export type AnswerSource = "rules" | "rules-translated" | "model" | "offline-rules";

/** What the UI renders. `source` is shown to the reader as a visible chip on
 *  every single answer — that chip is the credibility argument, not decoration. */
export interface Answer {
  text: string;
  steps: string[];
  avoid: string[];
  source: AnswerSource;
  lang: LangCode;
  intent: string;
  /** Rule/plan versions and the CAP identifiers this was assembled from, so an
   *  answer can be traced to the revision that produced it. */
  citations: string[];
  helplines: string[];
}

function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

/**
 * The hand-translated answer for an intent, in the reader's own language, built
 * with no network and no model. Numbers and names still come from lib/data.
 *
 * Returns null for intents the locale files do not cover; the caller then falls
 * back to the English rule-table lines, which is worse but never wrong.
 */
export function localAnswer(
  intent: Intent,
  districtId: string,
  lang: LangCode,
  t: Dict,
  offline: boolean,
): Answer | null {
  const alerts = alertsFor(districtId);
  const top = alerts[0] ?? null;
  const lvl = top ? level(top) : 0;
  const shelters = sheltersFor(districtId);
  const source: AnswerSource = offline ? "offline-rules" : "rules";
  const citations = [RULES_VERSION, PLAN_VERSION, ...(top ? [top.identifier] : [])];
  const base = { source, lang, intent, citations, helplines: [] as string[], avoid: [] as string[] };

  const mins = top?.onsetOffsetMin ?? null;
  const timeLine = mins === null || mins <= 0 ? t.ansAlreadyStarted : fill(t.ansTimeLeft, { n: Math.round(mins) });

  switch (intent) {
    case "should_i_leave":
      if (lvl >= 4) return { ...base, text: t.ansYesLeave, steps: [timeLine, t.ansPowerOff, t.ansTakeIntro] };
      if (lvl === 3) return { ...base, text: t.ansStayAlert, steps: [t.ansTake1, t.ansTake2, t.ansTake3] };
      return { ...base, text: t.ansNoLeave, steps: lvl === 2 ? [t.ansStayAlert] : [] };

    case "where_shelter":
    case "shelter_facilities": {
      const s = shelters[0];
      if (!s) return { ...base, text: t.ansNoShelter, steps: [] };
      return {
        ...base,
        text: fill(t.ansNearestShelter, { name: s.name, km: s.km, free: s.capacity - s.occupied }),
        steps: [
          `${t.askFor}: ${s.contact.role}`,
          ...(s.facilities.accessible ? [t.facAccessible] : []),
          ...(s.facilities.medical ? [t.facMedical] : []),
          ...(s.facilities.livestock ? [t.facLivestock] : []),
        ],
      };
    }

    case "what_to_take":
    case "documents":
    case "medicine":
      return { ...base, text: t.ansTakeIntro, steps: [t.ansTake1, t.ansTake2, t.ansTake3] };

    case "safe_to_drive": {
      const risky = top && ["flood", "urban-flood", "landslide", "cyclone"].includes(top.hazard);
      return { ...base, text: risky || lvl >= 3 ? t.ansDrivingNo : t.ansDrivingCare, steps: [] };
    }

    case "water_safe":
      return { ...base, text: t.ansWaterNo, steps: [t.ansTake2] };

    case "how_long":
      if (!top) return { ...base, text: t.ansNoLeave, steps: [] };
      return { ...base, text: timeLine, steps: [fill(t.ansSourceNote, { sender: top.senderName })] };

    case "what_happened":
      if (!top) return { ...base, text: t.allClear, steps: [t.allClearSub] };
      return {
        ...base,
        text: fill(t.ansSourceNote, { sender: top.senderName }),
        steps: [`${t.level} ${lvl}`, top.identifier],
      };

    case "who_to_call":
      return {
        ...base,
        text: fill(t.ansHelpline, { number: "112" }),
        steps: [`108 — ${t.callNow}`, `1078 — ${t.callNow}`],
        helplines: ["112", "108", "1078"],
      };

    case "power_gas":
      return { ...base, text: t.ansPowerOff, steps: [] };

    case "children_elderly":
      return { ...base, text: t.ansCheckOthers, steps: [t.ansTake1, t.ansTake2] };

    case "unknown":
      return {
        ...base,
        text: t.ansUnknown,
        steps: [t.ansTakeIntro, t.ansTake1, t.ansTake2, t.ansTake3],
        intent: "unknown",
      };

    default:
      return null;
  }
}

/** Turns a RuleAnswer's English lines into the Answer shape the UI renders. */
export function fromRuleLines(
  intent: Intent,
  lines: string[],
  avoid: string[] | undefined,
  numbers: string[] | undefined,
  districtId: string,
  lang: LangCode,
  translated: boolean,
): Answer {
  const alerts = alertsFor(districtId);
  return {
    text: lines[0] ?? "",
    steps: lines.slice(1),
    avoid: avoid ?? [],
    source: translated ? "rules-translated" : "rules",
    lang,
    intent,
    citations: [RULES_VERSION, PLAN_VERSION, ...alerts.map((a) => a.identifier)],
    helplines: numbers ?? [],
  };
}
