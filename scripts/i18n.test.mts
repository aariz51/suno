/* Translation integrity. This does NOT replace native-speaker review — nothing
 * automated can — but it catches every mechanical failure that review would
 * otherwise waste its time on:
 *   - a missing or empty key (a blank space on a warning screen)
 *   - untranslated English left in a non-English locale
 *   - text in the wrong script for the language
 *   - a {placeholder} lost or renamed, which silently drops a shelter name
 *     or a countdown from an answer
 *   - a contraction, which speech synthesis loses at speed
 * Run: npx tsx scripts/i18n.test.ts
 */
import enMod from "../lib/i18n/locales/en";
import { LANGS } from "../lib/i18n";

/** tsx's CJS interop can hand back the module namespace rather than the default
 *  export, which turns Object.keys() into ["default"]. Unwrap defensively. */
const unwrap = <T,>(m: unknown): T =>
  (m && typeof m === "object" && "default" in (m as Record<string, unknown>)
    ? (m as { default: T }).default
    : (m as T));
const en = unwrap<Record<string, string>>(enMod);

const SCRIPT_RANGE: Record<string, RegExp> = {
  deva: /[ऀ-ॿ]/, beng: /[ঀ-৿]/, guru: /[਀-੿]/,
  gujr: /[઀-૿]/, orya: /[଀-୿]/, taml: /[஀-௿]/,
  telu: /[ఀ-౿]/, knda: /[ಀ-೿]/, mlym: /[ഀ-ൿ]/,
  arab: /[؀-ۿ]/,
};

/** Keys whose value is legitimately a Latin/ASCII token in every language. */
const ASCII_OK = new Set(["sos"]);

const keys = Object.keys(en);
const problems: string[] = [];
let checked = 0;

for (const meta of LANGS) {
  if (meta.code === "en") continue;
  const dict = unwrap<Record<string, string>>(await import(`../lib/i18n/locales/${meta.code}`));
  const range = SCRIPT_RANGE[meta.script];
  let scripted = 0, total = 0;

  for (const k of keys) {
    const v = dict[k];
    if (v === undefined) { problems.push(`${meta.code}: MISSING key "${k}"`); continue; }
    if (!v.trim()) { problems.push(`${meta.code}: EMPTY key "${k}"`); continue; }
    checked++;

    // placeholders must survive translation exactly
    const want = [...String(en[k] ?? "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    const got = [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    if (want !== got) problems.push(`${meta.code}.${k}: placeholders "${want}" → "${got}"`);

    // untranslated English left behind
    if (!ASCII_OK.has(k) && v === String(en[k]) && /[a-zA-Z]{4}/.test(v))
      problems.push(`${meta.code}.${k}: identical to English — "${v.slice(0, 40)}"`);

    // contractions are lost by speech synthesis at speed
    if (/\b(don't|can't|won't|didn't|isn't|it's)\b/i.test(v))
      problems.push(`${meta.code}.${k}: contraction — "${v.slice(0, 40)}"`);

    if (range) { total++; if (range.test(v)) scripted++; }
  }

  // the bulk of a locale should actually be in that locale's script
  if (range && total > 0) {
    const pct = (scripted / total) * 100;
    if (pct < 80) problems.push(`${meta.code}: only ${pct.toFixed(0)}% of values contain ${meta.script} script`);
    console.log(`  ${meta.code.padEnd(3)} ${meta.english.padEnd(10)} ${keys.length} keys · ${pct.toFixed(0)}% in ${meta.script}`);
  }
}

console.log(`\n  ${LANGS.length} locales · ${keys.length} keys each · ${checked} values checked`);
if (problems.length) {
  console.log(`\n  ${problems.length} PROBLEMS:`);
  problems.slice(0, 30).forEach((p) => console.log("   - " + p));
  process.exit(1);
}
console.log("  no missing keys, no lost placeholders, no untranslated English, no contractions");
console.log("\n  NOTE: this is mechanical integrity only. Native-speaker review of the");
console.log("  wording is listed as a deployment precondition on /how-it-runs.");
