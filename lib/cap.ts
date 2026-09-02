// -----------------------------------------------------------------------------
// CAP v1.2 — A REAL PARSER
// -----------------------------------------------------------------------------
// Everywhere else on this site we say the same thing: our warnings are shaped
// field-for-field on CAP v1.2, so swapping the synthetic feed for a live one is
// a parser change rather than a redesign.
//
// This file is that parser. It is not a mock. Give it genuine CAP XML — the
// format NDMA's Sachet, IMD, CWC and INCOIS already publish in — and it returns
// the same Alert objects the rest of the app renders. That turns a claim a
// reviewer would have to take on trust into one they can test by pasting a
// bulletin into /pipeline and watching it become a warning screen.
//
// It is deliberately dependency-free. A regex-and-slice reader for a known
// subset of one schema is a few dozen lines; an XML library is a supply-chain
// decision, and this project's whole argument is about what it does not depend
// on. The limits of that trade are stated honestly in CAP_PARSER_LIMITS below.
//
// Spec: OASIS Common Alerting Protocol v1.2, and the CAP-IN profile NDMA uses.
// -----------------------------------------------------------------------------

import type { Alert, CapCertainty, CapSeverity, CapUrgency } from "./data/alerts";
import type { HazardType } from "./data/districts";

export const CAP_NS = "urn:oasis:names:tc:emergency:cap:1.2";

/** What this reader does not do, stated up front rather than discovered later. */
export const CAP_PARSER_LIMITS = [
  "Reads the first <info> block only. A real feed carries one per language, and the production reader would iterate them — that is the whole point of the format and it is section 03 on /how-it-runs.",
  "Does not verify the XML digital signature. A production ingester must, because an unsigned alert is an unauthenticated one.",
  "Does not resolve <polygon> or <circle> geometry. Areas are matched by <geocode> and by name against our district table.",
  "Does not follow <references> for updates and cancellations, so a Cancel message is parsed but not applied.",
  "Entity handling covers the five predefined XML entities and numeric escapes, not custom DTDs.",
];

// -----------------------------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&"); // last, so a literal &amp;lt; survives correctly
}

/** Strips a namespace prefix: cap:info and info are the same element. */
function tagPattern(name: string) {
  return new RegExp(`<(?:[A-Za-z0-9_.-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[A-Za-z0-9_.-]+:)?${name}>`, "i");
}
function tagPatternAll(name: string) {
  return new RegExp(`<(?:[A-Za-z0-9_.-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[A-Za-z0-9_.-]+:)?${name}>`, "gi");
}

/** First value of an element, trimmed and entity-decoded. */
export function one(xml: string, name: string): string | null {
  const m = xml.match(tagPattern(name));
  return m ? decodeEntities(m[1].trim()) : null;
}

/** Every value of a repeating element. */
export function many(xml: string, name: string): string[] {
  const out: string[] = [];
  for (const m of xml.matchAll(tagPatternAll(name))) out.push(decodeEntities(m[1].trim()));
  return out;
}

/** CAP <parameter><valueName>X</valueName><value>Y</value></parameter> pairs. */
export function parameters(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of xml.matchAll(tagPatternAll("parameter"))) {
    const k = one(m[1], "valueName");
    const v = one(m[1], "value");
    if (k) out[k] = v ?? "";
  }
  return out;
}

// -----------------------------------------------------------------------------

export interface ParsedCap {
  identifier: string;
  sender: string;
  sent: string;
  status: string;
  msgType: string;
  scope: string;
  info: {
    language: string;
    category: string;
    event: string;
    urgency: CapUrgency;
    severity: CapSeverity;
    certainty: CapCertainty;
    headline: string;
    description: string;
    instruction: string[];
    senderName: string;
    effective: string | null;
    onset: string | null;
    expires: string | null;
    areaDesc: string;
    geocodes: Record<string, string>;
    parameters: Record<string, string>;
  } | null;
  /** How many <info> blocks the document actually carries. THE number this whole
   *  product is about: a feed that ships one is a feed serving one language. */
  infoBlockCount: number;
  languagesPresent: string[];
  warnings: string[];
}

const SEVERITIES: CapSeverity[] = ["Extreme", "Severe", "Moderate", "Minor"];
const URGENCIES: CapUrgency[] = ["Immediate", "Expected", "Future", "Past"];
const CERTAINTIES: CapCertainty[] = ["Observed", "Likely", "Possible", "Unlikely"];

function pick<T extends string>(v: string | null, allowed: T[], fallback: T, warnings: string[], field: string): T {
  if (!v) {
    warnings.push(`<${field}> missing; defaulted to ${fallback}`);
    return fallback;
  }
  const hit = allowed.find((a) => a.toLowerCase() === v.toLowerCase());
  if (!hit) {
    warnings.push(`<${field}> value "${v}" is not in the CAP enumeration; defaulted to ${fallback}`);
    return fallback;
  }
  return hit;
}

export function parseCap(xml: string): ParsedCap {
  const warnings: string[] = [];
  const src = xml.trim();

  if (!/<(?:[A-Za-z0-9_.-]+:)?alert[\s>]/i.test(src)) {
    warnings.push("No <alert> element found. This does not look like a CAP document.");
  }
  if (!src.includes("cap:1.2") && !src.includes("cap:1.1")) {
    warnings.push("No CAP namespace declared. Parsed on a best-effort basis.");
  }

  const infoBlocks = [...src.matchAll(tagPatternAll("info"))].map((m) => m[1]);
  const languagesPresent = infoBlocks.map((b) => one(b, "language") ?? "und");
  const first = infoBlocks[0] ?? null;

  let info: ParsedCap["info"] = null;
  if (first) {
    const area = one(first, "area") ?? first;
    const geocodes: Record<string, string> = {};
    for (const m of area.matchAll(tagPatternAll("geocode"))) {
      const k = one(m[1], "valueName");
      const v = one(m[1], "value");
      if (k) geocodes[k] = v ?? "";
    }

    // CAP allows one <instruction>; senders in practice put several actions in
    // it, separated by newlines, semicolons or numbering. Split it, rather than
    // rendering a wall of text at somebody who has forty minutes.
    //
    // If the sender used line breaks, those ARE the structure and we split on
    // nothing else. Sentence-splitting on top of them shreds authored steps:
    // "Leave for higher ground now. Do not wait for water to reach your door."
    // is one instruction with a reason attached, not two instructions.
    // Sentence-splitting is the fallback for senders who supply one long line.
    const rawInstruction = one(first, "instruction") ?? "";
    const hasLineBreaks = /\r?\n/.test(rawInstruction.trim());
    const instruction = rawInstruction
      .split(hasLineBreaks ? /\r?\n/ : /(?<=[.;])\s+(?=[A-Z0-9])/)
      .map((x) => x.replace(/^\s*[-*•]\s*|^\s*\d+[.)]\s*/, "").trim())
      .filter((x) => x.length > 2);

    info = {
      language: one(first, "language") ?? "en-IN",
      category: one(first, "category") ?? "Met",
      event: one(first, "event") ?? "Unspecified event",
      urgency: pick(one(first, "urgency"), URGENCIES, "Expected", warnings, "urgency"),
      severity: pick(one(first, "severity"), SEVERITIES, "Moderate", warnings, "severity"),
      certainty: pick(one(first, "certainty"), CERTAINTIES, "Possible", warnings, "certainty"),
      headline: one(first, "headline") ?? "",
      description: one(first, "description") ?? "",
      instruction,
      senderName: one(first, "senderName") ?? one(src, "sender") ?? "Unknown sender",
      effective: one(first, "effective"),
      onset: one(first, "onset"),
      expires: one(first, "expires"),
      areaDesc: one(area, "areaDesc") ?? "",
      geocodes,
      parameters: parameters(first),
    };
  } else {
    warnings.push("No <info> block found; the alert carries no deliverable content.");
  }

  if (infoBlocks.length === 1) {
    warnings.push(
      "Exactly one <info> block. CAP allows one per language; a single block means this alert is deliverable in one language only.",
    );
  }

  return {
    identifier: one(src, "identifier") ?? "",
    sender: one(src, "sender") ?? "",
    sent: one(src, "sent") ?? "",
    status: one(src, "status") ?? "",
    msgType: one(src, "msgType") ?? "",
    scope: one(src, "scope") ?? "",
    info,
    infoBlockCount: infoBlocks.length,
    languagesPresent,
    warnings,
  };
}

// -----------------------------------------------------------------------------
// The other direction: our Alert as the CAP a production system would emit.
// -----------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Serialises one of our alerts back to CAP v1.2, with one <info> block per
 *  language supplied. Rendering the multi-language document the format was
 *  designed for is the clearest way to show that the gap is a filling problem,
 *  not a format problem. */
export function toCap(
  a: Alert,
  blocks: { language: string; headline: string; description: string; instruction: string[] }[],
  nowISO = new Date().toISOString(),
): string {
  const infos = blocks
    .map(
      (b) => `  <info>
    <language>${esc(b.language)}</language>
    <category>${esc(a.category)}</category>
    <event>${esc(a.event)}</event>
    <urgency>${a.urgency}</urgency>
    <severity>${a.severity}</severity>
    <certainty>${a.certainty}</certainty>
    <senderName>${esc(a.senderName)}</senderName>
    <headline>${esc(b.headline)}</headline>
    <description>${esc(b.description)}</description>
    <instruction>${esc(b.instruction.join("\n"))}</instruction>
    <area>
      <areaDesc>${esc(a.areaDesc)}</areaDesc>
      <geocode>
        <valueName>district</valueName>
        <value>${esc(a.districtId)}</value>
      </geocode>
    </area>
  </info>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="${CAP_NS}">
  <identifier>${esc(a.identifier)}</identifier>
  <sender>${esc(a.sender)}</sender>
  <sent>${esc(nowISO)}</sent>
  <status>${a.status}</status>
  <msgType>${a.msgType}</msgType>
  <scope>${a.scope}</scope>
${infos}
</alert>`;
}

// -----------------------------------------------------------------------------

/** CAP <event> text is free-form. Map it onto our hazard types deterministically
 *  — no model involved, because a misclassified hazard shows the wrong survival
 *  instructions. Returns null rather than guessing when nothing matches. */
export function hazardFromEvent(event: string, description = ""): HazardType | null {
  const t = `${event} ${description}`.toLowerCase();
  const table: [HazardType, RegExp][] = [
    ["cyclone", /cyclone|landfall|storm surge|depression|gale|hurricane|typhoon/],
    ["flood", /flood|inundat|danger level|danger mark|embankment|river|dam release|cloudburst/],
    ["landslide", /landslide|rockfall|debris flow|slope failure|avalanche/],
    ["earthquake", /earthquake|seismic|aftershock|tremor|magnitude/],
    ["heatwave", /heat ?wave|heat index|extreme heat/],
    ["coldwave", /cold ?wave|frost|snowfall|cold day/],
    ["thunderstorm", /thunderstorm|lightning|squall|hail|gusty/],
    ["wildfire", /forest fire|wildfire|bush fire/],
    ["drought", /drought|deficien|dry spell/],
    ["urban-flood", /waterlog|urban flood|street flooding/],
  ];
  for (const [h, re] of table) if (re.test(t)) return h;
  return null;
}
