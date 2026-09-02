/* Captures the whole product to ~/suno/screens as PNGs, so the build can be
 * reviewed without running it. Covers both themes, two languages, every screen,
 * and the three severity states. */
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.argv[2] || "http://localhost:3111";
const DIR = "screens";
fs.mkdirSync(DIR, { recursive: true });

const b = await chromium.launch();
const shot = async (name, fn, { theme = "light", lang = null, district = "golaghat", full = false } = {}) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript(([t, l, d]) => {
    try {
      localStorage.setItem("suno.theme", t);
      localStorage.setItem("suno.district", d);
      if (l) { localStorage.setItem("suno.lang", l); localStorage.setItem("suno.langExplicit", "1"); }
    } catch {}
  }, [theme, lang, district]);
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(1400);
  if (fn) await fn(p);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${DIR}/${name}.png`, fullPage: full });
  console.log(`  ${DIR}/${name}.png`);
  await ctx.close();
};

const tab = (n) => async (p) => { await p.locator("nav button").nth(n).click(); await p.waitForTimeout(900); };
const phase = (label) => async (p) => { await p.locator("button", { hasText: new RegExp(`^${label}$`) }).first().click(); await p.waitForTimeout(700); };

// severity states, in the language of the district
await shot("01-act-level4-assamese", null, { district: "golaghat" });
await shot("02-act-level4-english", null, { district: "golaghat", lang: "en" });
await shot("03-watch-english", phase("Watch"), { district: "golaghat", lang: "en" });
await shot("04-calm-english", phase("Calm"), { district: "golaghat", lang: "en" });
await shot("05-cyclone-odia", null, { district: "puri" });

// every tab
await shot("06-alerts-map", tab(1), { lang: "en" });
await shot("07-plan", tab(2), { lang: "en" });
await shot("08-find", tab(3), { lang: "en" });
await shot("09-help-disclosure", tab(4), { lang: "en", full: true });

// the assistant, mid-answer
await shot("10-ask-answered", async (p) => {
  await p.locator("button", { hasText: /^Ask$/ }).last().click();
  await p.waitForTimeout(700);
  const i = p.getByPlaceholder(/Type your question/i);
  await i.fill("where is the nearest shelter");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(2600);
}, { lang: "en" });

// dark mode
await shot("11-dark-act", null, { theme: "dark", lang: "en" });
await shot("12-dark-alerts", tab(1), { theme: "dark", lang: "en" });

// the end-to-end page, full length
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(BASE + "/how-it-runs", { waitUntil: "networkidle" });
await p.waitForTimeout(900);
await p.screenshot({ path: `${DIR}/13-how-it-runs-full.png`, fullPage: true });
console.log(`  ${DIR}/13-how-it-runs-full.png`);

// desktop
await p.setViewportSize({ width: 1280, height: 900 });
await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForTimeout(1400);
await p.screenshot({ path: `${DIR}/14-desktop.png` });
console.log(`  ${DIR}/14-desktop.png`);
await b.close();
