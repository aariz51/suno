/* Studies the FIRST-VISIT experience of the reference build.
 *
 * A fresh context matters here: the reference gates its onboarding on
 * localStorage, so any browser that has opened it before will never show the
 * flow again. This script uses a clean context every time, denies geolocation
 * on one pass and grants it on another, and records what appears at each step.
 *
 * Run: node scripts/study-reference.mjs [url]
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const URL_ = process.argv[2] || "https://ndma-mu.vercel.app/";
const DIR = "study";
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch();

/** Everything visible above the fold, plus anything that looks like a modal. */
async function inspect(page, label) {
  const info = await page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 40 && r.height > 20 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
    };
    // Anything fixed/absolute with a high z-index and a backdrop is a modal.
    const overlays = [...document.querySelectorAll("div,section,dialog")]
      .filter((el) => {
        const s = getComputedStyle(el);
        const z = parseInt(s.zIndex || "0", 10);
        return (s.position === "fixed" || s.position === "absolute") && z >= 30 && vis(el);
      })
      .map((el) => ({
        z: getComputedStyle(el).zIndex,
        cls: (el.className || "").toString().slice(0, 120),
        text: (el.innerText || "").trim().slice(0, 400),
      }))
      .filter((o) => o.text.length > 0);

    const buttons = [...document.querySelectorAll("button,[role=button],a")]
      .filter(vis)
      .map((b) => (b.innerText || b.getAttribute("aria-label") || "").trim())
      .filter(Boolean)
      .slice(0, 40);

    return {
      title: document.title,
      bodyText: document.body.innerText.trim().slice(0, 1200),
      overlays,
      buttons,
      lang: document.documentElement.lang,
    };
  });

  await page.screenshot({ path: `${DIR}/${label}.png` });
  console.log(`\n${"=".repeat(72)}\n${label}\n${"=".repeat(72)}`);
  console.log("lang:", info.lang);
  if (info.overlays.length) {
    console.log(`\n--- OVERLAYS (${info.overlays.length}) ---`);
    for (const o of info.overlays) console.log(`  [z${o.z}] ${o.text.replace(/\n/g, " | ").slice(0, 300)}`);
  } else {
    console.log("\n--- no overlay detected ---");
  }
  console.log("\n--- buttons ---");
  console.log("  " + info.buttons.join(" · "));
  console.log("\n--- body (first 700) ---");
  console.log(info.bodyText.slice(0, 700).split("\n").map((l) => "  " + l).join("\n"));
  return info;
}

const log = {};

// ---------------------------------------------------------------------------
// PASS 1 — first visit, geolocation NEVER answered (the real default: a browser
// shows the permission chip and the user ignores it).
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "en-IN",
    // No permissions granted and none denied: the prompt simply hangs, which is
    // what happens when a person does not tap the browser chip.
  });
  const page = await ctx.newPage();
  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });

  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  log.firstVisit = await inspect(page, "01-first-visit-no-geo");
  if (dialogs.length) console.log("\n  native dialogs:", dialogs);

  // Try to walk whatever onboarding appeared.
  const clickable = await page.evaluate(() =>
    [...document.querySelectorAll("button")]
      .filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 40 && r.height > 20;
      })
      .map((b) => (b.innerText || "").trim())
      .filter(Boolean),
  );
  console.log("\n  clickable on first paint:", clickable.join(" · "));
  await ctx.close();
}

// ---------------------------------------------------------------------------
// PASS 2 — first visit with geolocation GRANTED, positioned in Assam.
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "en-IN",
    permissions: ["geolocation"],
    geolocation: { latitude: 26.51, longitude: 93.96 }, // Golaghat
  });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  log.granted = await inspect(page, "02-first-visit-geo-granted");
  await ctx.close();
}

// ---------------------------------------------------------------------------
// PASS 3 — walk the onboarding: click each state option and record where it goes.
// ---------------------------------------------------------------------------
for (const choice of ["Calm", "Watch", "Act"]) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, locale: "en-IN",
  });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);

  const btn = page.locator("button", { hasText: new RegExp(`^\\s*${choice}`, "i") }).first();
  if (await btn.count()) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(1600);
    log[`choice_${choice}`] = await inspect(page, `03-after-${choice.toLowerCase()}`);
  } else {
    console.log(`\n  (no "${choice}" button found on first paint)`);
  }
  await ctx.close();
}

writeFileSync(`${DIR}/report.json`, JSON.stringify(log, null, 2));
console.log(`\n\nScreenshots and report.json written to ./${DIR}`);
await browser.close();
