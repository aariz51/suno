/* Desktop layout check. The app is mobile-first, but a reviewer opens it on a
 * laptop, and a phone column stranded in the middle of a 27-inch display reads
 * as unfinished rather than as a deliberate choice.
 *
 * Run: node scripts/desktop.test.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3111";
mkdirSync("screens/desktop", { recursive: true });

const SIZES = [
  { w: 1440, h: 900, name: "laptop" },
  { w: 1920, h: 1080, name: "desktop" },
  { w: 2560, h: 1440, name: "wide" },
  { w: 768, h: 1024, name: "tablet" },
  { w: 390, h: 844, name: "phone" },
];

const browser = await chromium.launch();
let fails = 0;

for (const { w, h, name } of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const ob = page.locator('[role="dialog"] button', { hasText: "Golaghat" }).first();
  if (await ob.count()) { await ob.click(); await page.waitForTimeout(900); }

  const m = await page.evaluate(() => {
    const rect = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
    const rail = rect("aside[aria-label='Sections']");
    const bottomNav = [...document.querySelectorAll("nav")]
      .map((n) => ({ n, r: n.getBoundingClientRect() }))
      .find(({ r }) => r.height > 0 && r.bottom > window.innerHeight - 120);
    const main = rect("main");
    const h1 = rect("main h1");
    return {
      vw: window.innerWidth,
      railVisible: !!rail && rail.width > 0,
      railW: rail ? Math.round(rail.width) : 0,
      bottomNavVisible: !!bottomNav,
      mainW: main ? Math.round(main.width) : 0,
      h1W: h1 ? Math.round(h1.width) : 0,
      hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      usedFraction: main ? +(main.width / window.innerWidth).toFixed(2) : 0,
    };
  });

  await page.screenshot({ path: `screens/desktop/${name}.png` });

  // Expectations: rail on >=1024, bottom bar below it, never both, no h-scroll,
  // and the content must actually occupy the viewport it was given.
  const wantRail = w >= 1024;
  const problems = [];
  if (m.railVisible !== wantRail) problems.push(`rail ${m.railVisible ? "shown" : "hidden"} at ${w}px`);
  if (m.bottomNavVisible === wantRail) problems.push(`bottom bar ${m.bottomNavVisible ? "shown" : "hidden"} at ${w}px`);
  if (m.hScroll) problems.push("horizontal scroll");
  if (wantRail && m.usedFraction < 0.55) problems.push(`content uses only ${Math.round(m.usedFraction * 100)}% of width`);
  if (errors.length) problems.push(`${errors.length} page error(s)`);

  const ok = problems.length === 0;
  if (!ok) fails++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${name.padEnd(8)} ${String(w).padStart(4)}px  rail=${m.railW}px  main=${m.mainW}px (${Math.round(m.usedFraction * 100)}% of viewport)  bottomBar=${m.bottomNavVisible}`,
  );
  problems.forEach((p) => console.log(`          ! ${p}`));
  await ctx.close();
}

console.log(`\n  ${SIZES.length - fails}/${SIZES.length} viewports lay out correctly`);
await browser.close();
process.exit(fails ? 1 : 0);
