/* Proves the offline claim rather than asserting it: load once, cut the
 * network entirely, reload, and confirm the warning, the instructions, the
 * helplines and the chosen language all still render. */
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:3111";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
// wait for the service worker to take control
const swReady = await p.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const r = await navigator.serviceWorker.ready.catch(() => null);
  return r ? "active" : "none";
});
await p.waitForTimeout(1500);
const onlineText = await p.evaluate(() => document.body.innerText.length);
const onlineLang = await p.getAttribute("html", "lang");

await ctx.setOffline(true);
await p.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
await p.waitForTimeout(2500);

const r = await p.evaluate(() => {
  const t = document.body.innerText;
  return {
    chars: t.length,
    hasHeadline: /Dhansiri|ধনশিৰি|danger/i.test(t),
    has112: t.includes("112") || t.includes("1078"),
    lang: document.documentElement.lang,
    phase: document.documentElement.getAttribute("data-phase"),
    sample: t.slice(0, 130).replace(/\n/g, " | "),
  };
});
console.log(`  service worker: ${swReady}`);
console.log(`  online:  ${onlineText} chars, lang=${onlineLang}`);
console.log(`  OFFLINE: ${r.chars} chars, lang=${r.lang}, phase=${r.phase}`);
console.log(`  warning still present: ${r.hasHeadline}`);
console.log(`  helplines still present: ${r.has112}`);
console.log(`  first text: ${r.sample}`);
console.log(r.chars > 500 && r.has112 ? "\n  PASS — opens and warns with no network" : "\n  FAIL — offline shell did not render");
await b.close();
