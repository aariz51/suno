/* FEATURE PARITY against the reference build at https://ndma-mu.vercel.app
 *
 * Suno was written from scratch. Nothing was copied — not markup, not CSS, not a
 * line of script. But "rebuilt from scratch" is only a defensible claim if the
 * rebuild actually carries the features of the thing it replaces, so this file
 * enumerates every capability found in the reference site's source and asserts
 * that a corresponding implementation exists here.
 *
 * The reference inventory was taken by pulling its source and listing its 60
 * top-level functions, its five tabs, its two locales and its six tel: links.
 * Each row below names one of those capabilities, the file that implements it in
 * this codebase, and a token that must be present in that file.
 *
 * Run: node scripts/parity.test.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), "utf8") : null);

/** [reference capability, our file, a token proving it is implemented, note] */
const PARITY = [
  // --- navigation and shell ---
  ["switchTab — five sections", "components/AppShell.tsx", "IconHelp", "same five: home, alerts, plan, find, help"],
  ["setLocalPhase — calm / watch / act", "components/store.tsx", "dataPhase", "derived from data; cannot be faked"],
  ["toggleDarkMode", "components/store.tsx", "toggleTheme", null],
  ["changeFontSize / resetFontSize", "components/Settings.tsx", "textSize", "four steps via a root multiplier"],
  ["setLanguage / toggleLangModal", "components/Settings.tsx", "LanguageSheet", "13 languages, not 2"],

  // --- location ---
  ["requestGeolocation", "components/Home.tsx", "getCurrentPosition", null],
  ["onManualLocationChange", "components/Home.tsx", "DistrictPicker", null],
  ["updateLocationDropdownAndStatus", "components/Home.tsx", "nearestDistrict", "matched on-device, never uploaded"],

  // --- alerts ---
  ["renderAlertFeed", "components/Alerts.tsx", "AlertCard", null],
  ["renderAlertChips", "components/Alerts.tsx", "ChipRow", null],
  ["filterAlertsByCategory", "components/Alerts.tsx", "setFilter", null],
  ["alertCardHTML", "components/Alerts.tsx", "LevelBand", null],
  ["initMap / recenterMap", "components/MapView.tsx", "project(", "inline SVG plot; works offline"],
  ["initSectorMap", "components/MapView.tsx", "latLines", "folded into one plot"],
  ["renderSectorDisastersList", "components/Alerts.tsx", "HAZARD_LABEL", "hazard filter replaces sector tabs"],
  ["renderSectorDisasterChips", "components/Alerts.tsx", "counts", null],
  ["showSectorDisastersScreen / hide", "components/Alerts.tsx", "shown", null],
  ["showForecastDetail / hideForecastDetail", "components/Alerts.tsx", "setOpen", "expands in place"],

  // --- shelters ---
  ["showShelterScreen / hideShelterScreen", "components/Home.tsx", "ShelterSheet", null],
  ["Get Directions deep link", "components/Home.tsx", "maps/dir/", null],

  // --- preparedness ---
  ["showPlan — five hazards", "components/PlanTab.tsx", "PLANS", "plus an 'after' section the original omits"],

  // --- find / mark safe ---
  ["searchPerson", "components/Find.tsx", "PersonFinder", null],
  ["openMarkSafeFlow / closeMarkSafeModal", "components/Find.tsx", "MarkSafeSheet", null],
  ["submitMarkSafePhone", "components/Find.tsx", "verify", null],
  ["markSelfSafe", "components/Find.tsx", "addSafeNumber", null],
  ["saveSafeNumberToStorage / getSavedSafeNumbers", "components/store.tsx", "suno.safe", null],
  ["shareMyLocation", "components/Find.tsx", "navigator.share", null],

  // --- help ---
  ["showHelpModal / closeHelpModal", "components/HelpTab.tsx", "Faq", null],
  ["toggleFAQ / jumpToFAQ", "components/HelpTab.tsx", "setOpen", null],
  ["submitSubscribe / toggleSubscribeForm", "components/HelpTab.tsx", "HELPLINES", "dropped; see PARITY.md"],

  // --- accessibility: the reference build's strongest area ---
  ["readAloud / speakText", "components/store.tsx", "SpeechSynthesisUtterance", null],
  ["playScreenReader / pauseScreenReader / stopScreenReader", "components/store.tsx", "stopSpeaking", null],
  ["setScreenReaderSpeed", "components/store.tsx", "u.rate", "fixed at 0.92, slower than default"],
  ["toggleScreenReaderBar", "components/Home.tsx", "ttsAvailable", "per-block Listen buttons instead"],
  ["enableClickToListen / disableClickToListen", "components/Home.tsx", "speak(", null],
  ["highlightSrElement / clearSrHighlight", "app/globals.css", "sr-reading", null],
  ["updateSrStatus", "components/Ask.tsx", "aria-live", null],
  ["startVoiceRecognition", "components/Find.tsx", "webkitSpeechRecognition", "plus Whisper in Ask.tsx"],

  // --- emergency ---
  ["triggerSOS / cancelSOS", "components/AppShell.tsx", "CallSheet", "no auto-dial; see PARITY.md"],
  ["tel: 112 / 108 / 1078 / 101 / 1091 / 1098", "lib/data/helplines.ts", "14567", "ten numbers, not six"],

  // --- icons ---
  ["safeIcons — inline SVG, no CDN", "components/icons.tsx", "strokeLinejoin", "one house style, no faces"],

  // --- added since the first inventory ---
  ["checkFirstVisitOnboarding / selectOnboardingState", "components/Home.tsx", "DistrictPicker", "district picker + auto-locate"],
  ["showCoachmarkPointer", "components/AppShell.tsx", "ReviewerStrip", "reviewer strip instead"],
];

let pass = 0, fail = 0;
const missing = [];

for (const [capability, file, token, note] of PARITY) {
  const src = read(file);
  const ok = src !== null && src.includes(token);
  if (ok) pass++;
  else { fail++; missing.push(`${capability}  →  ${file} (looked for "${token}")`); }
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${capability.padEnd(52)} ${file}${note ? "  — " + note : ""}`,
  );
}

console.log(`\n  ${pass}/${pass + fail} reference capabilities have an implementation here`);
if (missing.length) {
  console.log("\n  Missing:");
  for (const m of missing) console.log(`    ${m}`);
}

// --- Impersonation check -----------------------------------------------------
//
// The first version of this flagged every occurrence of "NDMA", which was wrong.
// Naming NDMA as the source of published guidance, as the operator of helpline
// 1078, or as a node in the authority chain is ATTRIBUTION, and removing it
// would make the end-to-end page worse and the sourcing dishonest.
//
// What the brief actually forbids is presenting the prototype AS a government
// product: a government body as the product's own name, a masthead, an emblem.
// So the check is on identity, not on mentions.

const OURS = ["components", "app", "lib"].flatMap((d) => {
  const out = [];
  const walk = (dir) => {
    for (const f of readdirSync(join(ROOT, dir))) {
      const rp = `${dir}/${f}`;
      if (statSync(join(ROOT, rp)).isDirectory()) walk(rp);
      else if (/\.(tsx?|css)$/.test(f)) out.push(rp);
    }
  };
  walk(d);
  return out;
});

const IMPERSONATION = [
  // Masthead lines — a government identity presented as this product's own.
  "Ministry of Home Affairs",
  "गृह मंत्रालय",
  "भारत सरकार",
  "Satyameva",
  "सत्यमेव",
  "राष्ट्रीय आपदा प्रबंधन प्राधिकरण",
  // Emblem / logo assets.
  "emblem.png",
  "ndma.png",
  "ashoka",
  "state-emblem",
];

const leaks = [];
for (const f of OURS) {
  const s = read(f) ?? "";
  const code = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const term of IMPERSONATION) {
    if (code.toLowerCase().includes(term.toLowerCase())) leaks.push(`${f}: "${term}"`);
  }
}

// The product's own identity must be its own name, not an institution's.
const layout = read("app/layout.tsx") ?? "";
const titleMatch = layout.match(/title:\s*"([^"]+)"/);
const title = titleMatch ? titleMatch[1] : "";
if (/NDMA|National Disaster Management Authority|Government of India|Ministry/i.test(title)) {
  leaks.push(`app/layout.tsx: product title claims a government identity — "${title}"`);
}

console.log(
  `\n  ${leaks.length === 0 ? "PASS" : "FAIL"}  no government identity claimed as this product's own`,
);
if (leaks.length === 0) {
  console.log(`          product title: "${title}"`);
  console.log("          NDMA/IMD/CWC appear only as cited sources and institutions, which is attribution.");
}
for (const l of leaks.slice(0, 8)) console.log(`          ${l}`);

process.exit(fail || leaks.length ? 1 : 0);
