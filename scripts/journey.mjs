/* End-to-end citizen journeys, clicked through as a person would.
 * "Every feature you demo must work" — so every feature gets a test. */
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:3111";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };

await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });

// A fresh context always meets the first-run chooser. Dismiss it into the Act
// district so the journey below starts from the state it expects.
await p.waitForTimeout(600);
const onboard = p.locator('[role="dialog"] button', { hasText: "Golaghat" }).first();
if (await onboard.count()) { await onboard.click(); await p.waitForTimeout(900); }
await p.waitForTimeout(1200);

// 1 — district drives language, without touching a language menu
check("district drives language (Golaghat → Assamese)",
  (await p.getAttribute("html", "lang")) === "as");

// 2 — severity owns the page ground
check("Level 4 sets the page ground",
  (await p.getAttribute("html", "data-phase")) === "act");

// 3 — the problem is stated with a number on the first screen
const bodyNow = await p.evaluate(() => document.body.innerText);
check("language gap stated as a number on screen one", /61%|\d+%/.test(bodyNow));

// 4 — the reviewer control jumps to districts that are genuinely in that state.
// It deliberately does NOT override the phase: a screen reading "no warning for
// your area" above a Level 4 card would be exactly the incoherence this product
// argues against. So the assertion is not just "the attribute changed" but "the
// attribute matches what that district's own data implies, and the screen does
// not contradict itself".
//
// Pin English first: jumping district also changes language (that is the whole
// point of the product), which would otherwise move the selectors out from under
// this test.
await p.evaluate(() => { try { localStorage.setItem("suno.lang", "en"); localStorage.setItem("suno.langExplicit", "1"); } catch {} });
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1000);

const jump = async (label) => {
  await p.locator("button").filter({ hasText: new RegExp(`^${label}$`) }).first().click();
  await p.waitForTimeout(600);
  return {
    phase: await p.getAttribute("html", "data-phase"),
    body: await p.evaluate(() => document.body.innerText),
  };
};

const calm = await jump("Calm");
const act = await jump("Act");

check("reviewer control reaches a genuinely calm district",
  calm.phase === "calm" && /No warning for your area/i.test(calm.body),
  `phase=${calm.phase}`);

// The bug this replaces: "no warning" and "EVACUATE NOW" on one screen.
check("the calm screen does not contradict itself",
  !(/No warning for your area/i.test(calm.body) && /EVACUATE NOW/i.test(calm.body)));

check("reviewer control reaches a genuinely Level 4 district",
  act.phase === "act" && /EVACUATE NOW/i.test(act.body),
  `phase=${act.phase}`);

// 5 — the assistant: ask a question, get a grounded answer with a source chip
// Pin the UI to English first so selectors are stable; the language behaviour
// itself is asserted separately in checks 1 and 7.
await p.evaluate(() => { try { localStorage.setItem("suno.lang", "en"); localStorage.setItem("suno.langExplicit", "1"); } catch {} });
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1200);

let askOk = false, askDetail = "";
try {
  await p.locator("button", { hasText: /^Ask$/ }).last().click();
  await p.waitForTimeout(800);
  const input = p.getByPlaceholder(/Type your question/i);
  await input.waitFor({ state: "visible", timeout: 8000 });
  await input.fill("where is the nearest shelter");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(2500);
  const t = await p.evaluate(() => document.body.innerText);
  askOk = /Bezbaruah/i.test(t);
  askDetail = askOk ? "answered with the real shelter from the register" : t.slice(-150).replace(/\n/g, " | ");
} catch (e) { askDetail = e.message.split("\n")[0].slice(0, 90); }
check("assistant answers, grounded in the shelter register", askOk, askDetail);

// 5b — the suggested questions exist, so a reviewer who will not type can still demo it
const chips = await p.evaluate(() =>
  [...document.querySelectorAll("button")].map((b) => b.innerText.trim())
    .filter((x) => /Should I leave|nearest shelter|take with me|safe to drive/i.test(x)).length);
check("suggested questions offered for non-typing reviewers", chips >= 3, `${chips} chips`);

// 6 — the source chip is visible on the answer (the credibility argument)
const chipVisible = await p.evaluate(() =>
  /rule table|model|offline/i.test(document.body.innerText));
check("answer shows which engine produced it", chipVisible);

await p.keyboard.press("Escape"); await p.waitForTimeout(400);

// 7 — district change. The language is pinned explicitly above, so the correct
// behaviour here is that the district does NOT override it. (The unpinned
// district-drives-language behaviour is asserted in check 1.)
await p.selectOption("select", "puri").catch(() => {});
await p.waitForTimeout(900);
const puriLang = await p.getAttribute("html", "lang");
const puriText = await p.evaluate(() => document.body.innerText);
check("an explicit language choice survives a district change", puriLang === "en", `lang=${puriLang}`);
check("Puri shows its own cyclone warning", /Cyclone|landfall/i.test(puriText));

// 7b — clear the explicit pin and confirm the district takes over again
await p.evaluate(() => { try { localStorage.removeItem("suno.langExplicit"); localStorage.setItem("suno.district", "puri"); } catch {} });
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1200);
check("with no explicit choice, Puri drives Odia",
  (await p.getAttribute("html", "lang")) === "or", `lang=${await p.getAttribute("html", "lang")}`);

// re-pin English for the remaining selector-based checks
await p.evaluate(() => { try { localStorage.setItem("suno.lang", "en"); localStorage.setItem("suno.langExplicit", "1"); localStorage.setItem("suno.district", "golaghat"); } catch {} });
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1200);

// 8 — mark safe → person finder round trip
let safeOk = false, safeDetail = "";
try {
  await p.locator("nav button:visible", { hasText: /^Find$/ }).first().click();
  await p.waitForTimeout(700);
  // the flow lives behind a button that opens a sheet
  await p.locator("button", { hasText: /^Mark yourself safe$/ }).last().click();
  await p.waitForTimeout(800);
  const numInput = p.locator("input[inputmode=numeric], input[type=text]").last();
  await numInput.waitFor({ state: "visible", timeout: 8000 });
  await numInput.fill("9812345678");
  await p.locator("button", { hasText: /Send code/i }).first().click();
  await p.waitForTimeout(1200);
  const codeShown = await p.evaluate(() => (document.body.innerText.match(/\b\d{6}\b/) || [])[0]);
  if (codeShown) {
    await p.locator("input").last().fill(codeShown);
    await p.locator("button", { hasText: /Verify|^Done$/i }).first().click();
    await p.waitForTimeout(1200);
  }
  const t = await p.evaluate(() => document.body.innerText);
  safeOk = Boolean(codeShown) && /safe/i.test(t);
  safeDetail = codeShown ? `code shown on screen (${codeShown}), no SMS sent` : "no code appeared";
} catch (e) { safeDetail = e.message.split("\n")[0].slice(0, 100); }
check("mark-safe flow completes with an on-screen code", safeOk, safeDetail);

// 8b — the searchable register actually finds a number that was marked safe
let findOk = false;
try {
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  const search = p.getByPlaceholder(/10-digit mobile number/i).first();
  await search.fill("9812345678");
  await p.locator("button", { hasText: /^Search$/ }).first().click();
  await p.waitForTimeout(900);
  findOk = /marked safe|SAFE/i.test(await p.evaluate(() => document.body.innerText));
} catch { /* reported below */ }
check("a number marked safe is then findable in the register", findOk);

// 9 — no runtime errors anywhere in the journey
check("no uncaught page errors during the whole journey", errs.length === 0, errs.join(" / "));

const failed = results.filter((r) => !r.ok);
console.log(`\n  ${results.length - failed.length}/${results.length} journeys pass`);
await b.close();
process.exit(failed.length ? 1 : 0);
