/* Captures the first-visit flow the way a reviewer will actually meet it:
 * a browser that has never seen this site, on a phone.
 *
 * Run: node scripts/shots-flow.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3111";
const DIR = "screens/flow";
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch();

async function fresh(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    locale: "en-IN",
    ...opts,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return { ctx, page, errors };
}

async function shot(page, name, full = false) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: full });
  console.log(`  saved ${name}.png`);
}

// --- 1. the landing page ----------------------------------------------------
{
  const { ctx, page, errors } = await fresh();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  console.log("\nLANDING");
  await shot(page, "01-landing-top");
  await shot(page, "01-landing-full", true);
  const h1 = await page.locator("h1").first().innerText();
  console.log("  h1:", h1.replace(/\n/g, " "));
  console.log("  errors:", errors.length);
  await ctx.close();
}

// --- 2. first visit to the app, geolocation never answered ------------------
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  console.log("\nAPP — FIRST VISIT (onboarding should be showing)");
  await shot(page, "02-onboarding");

  const dialog = page.locator('[role="dialog"]');
  const visible = await dialog.isVisible().catch(() => false);
  console.log("  onboarding visible:", visible);
  if (visible) {
    const txt = (await dialog.innerText()).split("\n").filter(Boolean);
    console.log("  " + txt.slice(0, 14).join(" | "));
  }
  console.log("  errors:", errors.length);
  await ctx.close();
}

// --- 3. each option, and where it lands -------------------------------------
for (const [label, district, expectPhase] of [["Calm","New Delhi","calm"], ["Watch","Wayanad","watch"], ["Act","Golaghat","act"]]) {
  const { ctx, page, errors } = await fresh();
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const btn = page.locator('[role="dialog"] button', { hasText: district }).first();
  if (!(await btn.count())) {
    console.log(`\n  !! no "${label}" option found`);
    await ctx.close();
    continue;
  }
  await btn.click();
  await page.waitForTimeout(1400);

  const state = await page.evaluate(() => ({
    phase: document.documentElement.getAttribute("data-phase"),
    lang: document.documentElement.lang,
    dialogGone: !document.querySelector('[role="dialog"]'),
    heading: document.querySelector("main h1")?.textContent?.trim().slice(0, 80) ?? null,
  }));
  console.log(`\nCHOSE "${label}" → phase=${state.phase} lang=${state.lang} dialogClosed=${state.dialogGone}`);
  console.log("  heading:", state.heading);
  console.log("  matches expected phase:", state.phase === expectPhase ? "YES" : `NO (wanted ${expectPhase})`);
  console.log("  errors:", errors.length);
  await shot(page, `03-after-${label.toLowerCase()}`);
  await ctx.close();
}

// --- 4. geolocation granted, positioned in Assam ----------------------------
{
  const { ctx, page, errors } = await fresh({
    permissions: ["geolocation"],
    geolocation: { latitude: 26.51, longitude: 93.96 },
  });
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const btn = page.locator('[role="dialog"] button', { hasText: /nearest district on your device/i }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(2200);
  }
  const state = await page.evaluate(() => ({
    phase: document.documentElement.getAttribute("data-phase"),
    lang: document.documentElement.lang,
    dialogGone: !document.querySelector('[role="dialog"]'),
  }));
  console.log(`\nGEOLOCATION (Golaghat) → phase=${state.phase} lang=${state.lang} dialogClosed=${state.dialogGone}`);
  console.log("  errors:", errors.length);
  await shot(page, "04-geolocated");
  await ctx.close();
}

// --- 5. returning visitor: onboarding must not reappear ---------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const first = await page.locator('[role="dialog"]').isVisible().catch(() => false);
  const btn = page.locator('[role="dialog"] button', { hasText: 'Golaghat' }).first();
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(900);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const second = await page.locator('[role="dialog"]').isVisible().catch(() => false);
  console.log(`\nRETURNING VISITOR → onboarding on first load: ${first}, after reload: ${second}`);
  console.log("  correct:", first === true && second === false ? "YES" : "NO");
  await ctx.close();
}

console.log(`\nScreens in ./${DIR}`);
await browser.close();
