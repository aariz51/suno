/* Motion checks.
 *
 * Animation on a page about disaster warnings has exactly one hard rule: it may
 * never be the reason a reader cannot see something. These four cases assert
 * that rule from both ends — the motion runs, and the page is complete without it.
 *
 * Run: node scripts/motion.test.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3111";
const browser = await chromium.launch();
let fails = 0;

function check(name, ok, detail = "") {
  if (!ok) fails++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

/** Everything a reader must be able to read, regardless of motion. */
const MUST_CONTAIN = [
  "The warning,",
  "The alert format has room for",
  "The same product, in three states",
  "What it actually does",
  "What is real here, and what is not",
  "Open it. It will ask where you are.",
];

// --- 1. JavaScript disabled: the whole page must still be readable ----------
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);

  const txt = await page.evaluate(() => document.body.innerText);
  const missing = MUST_CONTAIN.filter((t) => !txt.includes(t));
  check("no JavaScript: every section is still readable", missing.length === 0, missing.join(" / "));

  // Nothing may be sitting at opacity 0 waiting for a script that never ran.
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("[data-reveal]")].filter(
      (e) => parseFloat(getComputedStyle(e).opacity) < 0.9,
    ).length);
  check("no JavaScript: nothing is left invisible", hidden === 0, `${hidden} element(s) at opacity < 0.9`);
  await ctx.close();
}

// --- 2. Reduced motion: content present, transitions suppressed -------------
{
  const ctx = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);

  const r = await page.evaluate(() => {
    const targets = [...document.querySelectorAll("[data-reveal]")];
    const invisible = targets.filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.9).length;
    const slot = document.querySelector(".a-slot-empty");
    return {
      total: targets.length,
      invisible,
      slotAnimation: slot ? getComputedStyle(slot).animationName : "none",
    };
  });
  check("reduced motion: all reveal targets visible", r.invisible === 0, `${r.total} targets, ${r.invisible} hidden`);
  check("reduced motion: the looping slot pulse is off", r.slotAnimation === "none", r.slotAnimation);
  await ctx.close();
}

// --- 3. Motion actually runs ------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Immediately after load, sections far below the fold should still be hidden.
  const early = await page.evaluate(() =>
    [...document.querySelectorAll("[data-reveal]")].filter(
      (e) => !e.hasAttribute("data-in"),
    ).length);
  check("on load: below-the-fold sections start hidden", early > 0, `${early} awaiting reveal`);

  // Scroll through and they should all resolve.
  for (let y = 0; y <= 1; y += 0.1) {
    await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), y);
    await page.waitForTimeout(220);
  }
  await page.waitForTimeout(900);

  const late = await page.evaluate(() => {
    const t = [...document.querySelectorAll("[data-reveal]")];
    return {
      total: t.length,
      unrevealed: t.filter((e) => !e.hasAttribute("data-in")).length,
      invisible: t.filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.9).length,
    };
  });
  check("after scrolling: every section has revealed", late.unrevealed === 0, `${late.unrevealed}/${late.total} still hidden`);
  check("after scrolling: nothing is left invisible", late.invisible === 0, `${late.invisible} at opacity < 0.9`);
  await ctx.close();
}

// --- 4. The counters and the rotating word ---------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2")].find((h) => /What it actually does/.test(h.textContent || ""));
    el?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(1600);

  const nums = await page.evaluate(() =>
    [...document.querySelectorAll(".num")]
      .map((e) => (e.textContent || "").trim())
      .filter((t) => /^\d+$/.test(t)));
  check("counters reach their final values", nums.includes("13") && nums.includes("10"), nums.join(","));

  // The rotating word must change on its own, and must expose all 13 to a
  // screen reader rather than only the one currently showing.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const first = await page.evaluate(() => document.querySelector(".a-rotate-in")?.textContent ?? "");
  await page.waitForTimeout(2600);
  const second = await page.evaluate(() => document.querySelector(".a-rotate-in")?.textContent ?? "");
  check("hero word rotates through languages", Boolean(first) && first !== second, `${first} → ${second}`);

  const sr = await page.evaluate(() =>
    [...document.querySelectorAll(".sr-only")].map((e) => e.textContent || "").join(" "));
  check("all 13 languages exposed to assistive tech", /Assamese/.test(sr) && /Malayalam/.test(sr) && /Urdu/.test(sr));
  await ctx.close();
}

console.log(`\n  ${fails === 0 ? "all motion checks pass" : `${fails} check(s) failed`}`);
await browser.close();
process.exit(fails ? 1 : 0);
