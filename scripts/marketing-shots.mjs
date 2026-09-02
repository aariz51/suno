/* Captures the real product for the landing page.
 *
 * These are screenshots of the actual running build, not mockups — the landing
 * page claims the app switches language by district and turns the ground red at
 * Level 4, and the reader should be able to see that it does.
 *
 * Run: node scripts/marketing-shots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3111";
const OUT = "public/shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function phone(district, name, after) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    locale: "en-IN",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  const ob = page.locator('[role="dialog"] button', { hasText: district }).first();
  if (await ob.count()) { await ob.click(); await page.waitForTimeout(1200); }

  // Give the model translation time to land, so the shot shows the real thing.
  await page.waitForTimeout(5000);

  // The reviewer strip is scaffolding, not product. Hide it for the shot only;
  // it is still there in the build, and the landing page says so.
  // Target the strip by its own attribute. Searching for the text matched an
  // ancestor first and hid the entire application.
  await page.evaluate(() => {
    document.querySelector("[data-reviewer-strip]")?.setAttribute("hidden", "");
  });
  await page.waitForTimeout(300);

  if (after) await after(page);

  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ${name}.png`);
  await ctx.close();
}

await phone("Golaghat", "act");
await phone("Wayanad", "watch");
await phone("New Delhi", "calm");

// The assistant sheet, open. Whether an answer has landed is timing-dependent
// and not worth scripting; the control itself is the frame worth showing.
await phone("Golaghat", "ask", async (page) => {
  const btn = page.locator("button").filter({ hasText: /Ask|সোধক/ }).last();
  if (await btn.count()) {
    await btn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
});

// The desktop application, for the hero.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const ob = page.locator('[role="dialog"] button', { hasText: "Golaghat" }).first();
  if (await ob.count()) { await ob.click(); await page.waitForTimeout(1200); }
  await page.waitForTimeout(5000);
  // Target the strip by its own attribute. Searching for the text matched an
  // ancestor first and hid the entire application.
  await page.evaluate(() => {
    document.querySelector("[data-reviewer-strip]")?.setAttribute("hidden", "");
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/desktop.png` });
  console.log("  desktop.png");
  await ctx.close();
}

await browser.close();
console.log(`\nShots in ${OUT}`);
