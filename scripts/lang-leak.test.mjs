/* Fails if any non-English locale renders a Latin-script sentence.
 *
 * This exists because the failure it catches is the one that would most
 * embarrass this particular product: an app whose entire argument is "the
 * warning should be in your language" showing an Urdu reader an English
 * sentence. Proper nouns are allowed — a shelter's name is its name.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3111";
const LANGS = ["ur", "as", "or", "ta", "ml", "hi"];

/* Names of real places and institutions, which stay as they are, plus format
 * identifiers and agency acronyms that are proper nouns in any language. */
const ALLOWED = [
  /Noida|Greater Noida|Gurugram|Faridabad|Ghaziabad|Golaghat|Numaligarh|Dhansiri|Assam|Bezbaruah|Dergaon|Wayanad|Kerala|Puri|Odisha|Chamoli|Delhi|Kalpetta|Baliapanda|Satapada|Pipalkoti|Gopeshwar|Kavi Nagar|Raj Nagar|Modinagar|Pandu|Chakratirtha|Uttarakhand|Himachal|Shimla|Nagpur|Maharashtra|Guwahati|Jodhpur|Rajasthan|Bengal|Kolkata/i,
  /^(CAP|IMD|CWC|NDRF|NDMA|GSI|NCS|SOS|MPCS|DoT|OASIS)\b/,
  /^[A-Z]{2,5}-[A-Z]{2,4}\.\d{4}\.\d{4}/,
  /Suno/,
];

const browser = await chromium.launch();
let failed = 0;

for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const ob = page.locator('[role="dialog"] button', { hasText: "Golaghat" }).first();
  if (await ob.count()) { await ob.click(); await page.waitForTimeout(700); }
  await page.evaluate((l) => {
    try { localStorage.setItem("suno.lang", l); localStorage.setItem("suno.langExplicit", "1"); } catch {}
  }, lang);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(6000);

  const leaks = await page.evaluate(() =>
    document.body.innerText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && /^[\x20-\x7E]+$/.test(s) && /[a-z]{4}/.test(s)),
  );
  const real = leaks.filter((l) => !ALLOWED.some((re) => re.test(l)));
  const ok = real.length === 0;
  if (!ok) failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${lang}  ${ok ? "no English left in the UI" : `${real.length} leak(s)`}`);
  real.slice(0, 4).forEach((l) => console.log(`         - ${l.slice(0, 88)}`));
  await ctx.close();
}

console.log(`\n  ${LANGS.length - failed}/${LANGS.length} locales render with no untranslated English`);
await browser.close();
process.exit(failed ? 1 : 0);
