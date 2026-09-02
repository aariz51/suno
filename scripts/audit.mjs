/* Repeatable UI audit. Run: node scripts/audit.mjs [baseUrl]
 * Checks the things the six judging criteria actually turn on, per screen,
 * at a mid-range Android viewport. Everything here is measured, not eyeballed. */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:3111";
const OUT = "audit-report.json";

const AUDIT = () => {
  const body = document.body.innerText;
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  // Colours resolved from color-mix() come back as oklab(), which a naive rgb
  // regex reads as garbage and reports as 1.16:1 on perfectly legible text.
  // Convert properly, or return null and skip rather than invent a failure.
  const srgbLum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const oklabLum = (L, a, bb) => {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * bb;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    const lin = [
      +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ].map((v) => Math.min(1, Math.max(0, v)));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };
  const lum = (c) => {
    if (!c) return null;
    if (typeof c === "string" && c.startsWith("LUM:")) return parseFloat(c.slice(4));
    if (c.startsWith("oklab")) {
      const m = c.match(/-?[\d.]+/g); if (!m || m.length < 3) return null;
      return oklabLum(parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2]));
    }
    const m = c.match(/[\d.]+/g); if (!m || m.length < 3) return null;
    return srgbLum(+m[0], +m[1], +m[2]);
  };
  // Translucent backgrounds must be COMPOSITED against what is behind them, not
  // treated as opaque. A white-at-10% pill over a dark bar is dark, and reporting
  // it as white is how a checker invents a 1.00:1 failure on legible text.
  const alphaOf = (c) => {
    if (!c) return 0;
    const m = c.match(/[\d.]+\s*\)$/);
    if (/rgba|\/\s*[\d.]+\s*\)/.test(c) && m) return parseFloat(m[0]);
    if (/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return 0;
    return 1;
  };
  const bgOf = (el) => {
    // Walk outward, compositing every translucent layer until fully opaque.
    const layers = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const c = getComputedStyle(n).backgroundColor;
      const a = alphaOf(c);
      if (a > 0) { layers.push([c, a]); if (a >= 0.999) break; }
      n = n.parentElement;
    }
    const base = getComputedStyle(document.body).backgroundColor;
    if (!layers.length) return base;
    if (layers[layers.length - 1][1] < 0.999) layers.push([base, 1]);
    // Composite back-to-front.
    let acc = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const [c, a] = layers[i];
      const L = lum(c);
      if (L == null) continue;
      acc = acc == null ? L : L * a + acc * (1 - a);
    }
    return acc == null ? base : "LUM:" + acc;
  };
  const contrast = [];
  for (const el of [...document.querySelectorAll("p,span,div,li,h1,h2,h3,h4,button,a,label")].filter(vis)) {
    if (!el.childNodes.length) continue;
    const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
    if (!direct) continue;
    const cs = getComputedStyle(el);
    const l1 = lum(cs.color), l2 = lum(bgOf(el));
    if (l1 == null || l2 == null) continue;
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) contrast.push({ t: el.innerText.trim().slice(0, 34), ratio: +ratio.toFixed(2), need, px: +px.toFixed(1), fg: cs.color, bg: bgOf(el), tag: el.tagName, cls: (el.className || '').toString().slice(0, 60) });
  }
  return {
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    smallTaps: [...document.querySelectorAll("button,a[href],select,input,[role=button]")]
      .filter((e) => vis(e) && e.getBoundingClientRect().height < 44 && !e.classList.contains("skip")
        && !(e.tagName === "A" && e.parentElement && /^(P|LI|SPAN|TD)$/.test(e.parentElement.tagName)))
      .map((e) => ({ t: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 22), h: Math.round(e.getBoundingClientRect().height) })),
    unlabelled: [...document.querySelectorAll("button,a[href]")]
      .filter((e) => vis(e) && !(e.innerText || "").trim() && !e.getAttribute("aria-label") && !e.getAttribute("title"))
      .map((e) => e.outerHTML.slice(0, 70)),
    // Naming NDMA or IMD as the SOURCE of a warning is honest attribution.
    // Impersonation is claiming to BE them. Only the latter is a rule breach.
    forbidden: ["Government of India", "Ministry of Home Affairs", "Satyameva", "भारत सरकार",
                "National Disaster Management Authority", "Sachet Emergency Network"].filter((s) => body.includes(s)),
    junk: body.match(/NaN|undefined|\[object|\{[a-z]+\}|--:--/g) || [],
    contrastFails: contrast.slice(0, 12),
    imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.alt).length,
    svgNoLabel: [...document.querySelectorAll("svg")].filter((s) => !s.getAttribute("aria-hidden") && !s.getAttribute("role") && !s.getAttribute("aria-label")).length,
    headings: [...document.querySelectorAll("h1,h2")].map((h) => h.tagName + ":" + h.innerText.trim().slice(0, 40)).slice(0, 8),
    chars: body.length,
  };
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 160)));

const report = { base: BASE, at: new Date().toISOString(), screens: {}, errors: [] };

// The landing page. A reviewer meets this first, so it is audited like any
// other screen rather than treated as marketing that does not have to pass.
await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
report.screens.landing = await p.evaluate(AUDIT);

// The product. A fresh context always meets the first-run chooser, which is
// itself a screen and is audited before being dismissed into the Act district.
await p.goto(BASE + "/app", { waitUntil: "networkidle" });
await p.waitForTimeout(700);
report.screens.onboarding = await p.evaluate(AUDIT);
try {
  const ob = p.locator('[role="dialog"] button', { hasText: "Golaghat" }).first();
  if (await ob.count()) { await ob.click(); await p.waitForTimeout(900); }
} catch { /* already dismissed */ }

report.screens.home = await p.evaluate(AUDIT);
report.lang = await p.getAttribute("html", "lang");
report.phase = await p.getAttribute("html", "data-phase");

// Walk the bottom navigation by its accessible names.
const navNames = await p.evaluate(() =>
  [...document.querySelectorAll("nav button")]
    .filter((b) => b.getBoundingClientRect().height > 0)
    .map((x) => (x.innerText || "").trim())
    .filter(Boolean));
report.nav = navNames;
for (const name of navNames) {
  try {
    await p.locator("nav button:visible", { hasText: name }).first().click();
    await p.waitForTimeout(600);
    await p.evaluate(() => window.scrollTo(0, 0));
    report.screens[name] = await p.evaluate(AUDIT);
  } catch (e) { report.screens[name] = { error: e.message.slice(0, 120) }; }
}

// The end-to-end page.
await p.goto(BASE + "/how-it-runs", { waitUntil: "networkidle" });
await p.waitForTimeout(400);
report.screens["how-it-runs"] = await p.evaluate(AUDIT);

// The pipeline view.
await p.goto(BASE + "/pipeline", { waitUntil: "networkidle" });
await p.waitForTimeout(600);
report.screens["pipeline"] = await p.evaluate(AUDIT);

report.errors = [...new Set(errors)];
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

// Console summary
const sum = (k, v) => {
  const bits = [];
  if (v.error) return `${k}: ERROR ${v.error}`;
  if (v.overflow) bits.push("H-OVERFLOW");
  if (v.smallTaps?.length) bits.push(`${v.smallTaps.length} small taps`);
  if (v.unlabelled?.length) bits.push(`${v.unlabelled.length} unlabelled`);
  if (v.forbidden?.length) bits.push(`FORBIDDEN ${v.forbidden.join("/")}`);
  if (v.junk?.length) bits.push(`junk ${[...new Set(v.junk)].join(",")}`);
  if (v.contrastFails?.length) bits.push(`${v.contrastFails.length} contrast`);
  if (v.imgsNoAlt) bits.push(`${v.imgsNoAlt} img no alt`);
  return `${k.padEnd(14)} ${v.chars ?? 0} chars  ${bits.length ? bits.join(" · ") : "clean"}`;
};
console.log(`\nlang=${report.lang} phase=${report.phase} nav=[${report.nav.join(", ")}]\n`);
for (const [k, v] of Object.entries(report.screens)) console.log(sum(k, v));
console.log(`\nconsole errors: ${report.errors.length}`);
report.errors.forEach((e) => console.log("  - " + e));
await b.close();
