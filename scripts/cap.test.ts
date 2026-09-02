/* Proves the CAP reader is real code, not a prop.
 *
 * The site claims in several places that swapping the synthetic feed for a live
 * one is "a parser change, not a redesign". That claim is only worth making if
 * the parser handles CAP as actually published — namespaced prefixes, entity
 * escapes, multiple <info> blocks, missing optional fields, and the messy
 * free-text <instruction> that senders really write.
 *
 * Run: npx tsx scripts/cap.test.ts
 */
import { parseCap, toCap, hazardFromEvent } from "../lib/cap";
import { ALERTS } from "../lib/data/alerts";

let fails = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (!cond) fails++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

// --- 1. A plain, well-formed alert -----------------------------------------
const basic = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>IMD-BBS.2026.1180</identifier>
  <sender>imd.cyclone.bbsr@example.invalid</sender>
  <sent>2026-08-29T04:00:00+05:30</sent>
  <status>Actual</status><msgType>Update</msgType><scope>Public</scope>
  <info>
    <language>en-IN</language><category>Met</category>
    <event>Cyclone Warning</event>
    <urgency>Expected</urgency><severity>Severe</severity><certainty>Likely</certainty>
    <senderName>India Meteorological Department</senderName>
    <headline>Cyclone landfall expected near Puri in 24 hours</headline>
    <description>Sustained winds of 100-110 km/h gusting to 120 km/h.</description>
    <instruction>Move to a cyclone shelter today.
Charge every phone now.
Do not go outside during the calm eye.</instruction>
    <area>
      <areaDesc>Puri district, Odisha</areaDesc>
      <geocode><valueName>district</valueName><value>puri</value></geocode>
    </area>
  </info>
</alert>`;

{
  const p = parseCap(basic);
  ok("identifier read", p.identifier === "IMD-BBS.2026.1180", p.identifier);
  ok("severity read", p.info?.severity === "Severe");
  ok("urgency read", p.info?.urgency === "Expected");
  ok("area geocode read", p.info?.geocodes.district === "puri", p.info?.geocodes.district);
  ok("instruction split into 3 actions", p.info?.instruction.length === 3, String(p.info?.instruction.length));
  ok("hazard classified from free-text event", hazardFromEvent(p.info!.event, p.info!.description) === "cyclone");
}

// --- 2. Namespaced prefixes, as several real senders emit -------------------
{
  const prefixed = basic
    .replace(/<(\/?)(alert|identifier|sender|sent|status|msgType|scope|info|language|category|event|urgency|severity|certainty|senderName|headline|description|instruction|area|areaDesc|geocode|valueName|value)\b/g, "<$1cap:$2")
    .replace("<cap:alert xmlns=", "<cap:alert xmlns:cap=");
  const p = parseCap(prefixed);
  ok("cap: prefixed elements parse", p.identifier === "IMD-BBS.2026.1180" && p.info?.severity === "Severe", p.identifier);
}

// --- 3. Entity escapes must survive ----------------------------------------
{
  const esc = basic.replace(
    "<headline>Cyclone landfall expected near Puri in 24 hours</headline>",
    "<headline>Winds &gt; 100 km/h &amp; storm surge &lt;2 m</headline>",
  );
  const p = parseCap(esc);
  ok("entities decoded", p.info?.headline === "Winds > 100 km/h & storm surge <2 m", p.info?.headline);
}

// --- 4. Multiple <info> blocks: the number the product is about -------------
{
  const multi = basic.replace(
    "</info>\n</alert>",
    `</info>
  <info><language>or-IN</language><event>Cyclone Warning</event>
    <urgency>Expected</urgency><severity>Severe</severity><certainty>Likely</certainty>
    <headline>ପୁରୀ ନିକଟରେ ୨୪ ଘଣ୍ଟାରେ ଚକ୍ରବାତ</headline></info>
</alert>`,
  );
  const p = parseCap(multi);
  ok("counts every <info> block", p.infoBlockCount === 2, String(p.infoBlockCount));
  ok("lists the languages present", p.languagesPresent.join(",") === "en-IN,or-IN", p.languagesPresent.join(","));
  ok("single-block warning NOT raised when 2 present", !p.warnings.some((w) => /one <info> block/i.test(w)));
}

// --- 5. Degrade honestly on bad input --------------------------------------
{
  const p = parseCap("<html><body>not a cap document</body></html>");
  ok("non-CAP input is reported, not crashed", p.warnings.some((w) => /does not look like a CAP/i.test(w)));
  ok("no info block reported", p.info === null);
}
{
  const noSeverity = basic.replace("<severity>Severe</severity>", "");
  const p = parseCap(noSeverity);
  ok("missing severity defaults and warns", p.info?.severity === "Moderate" && p.warnings.some((w) => /severity/i.test(w)));
}
{
  const bogus = basic.replace("<severity>Severe</severity>", "<severity>Catastrophic</severity>");
  const p = parseCap(bogus);
  ok("out-of-enumeration value rejected", p.info?.severity === "Moderate" && p.warnings.some((w) => /not in the CAP enumeration/i.test(w)));
}

// --- 6. Round trip: our alert -> CAP -> back --------------------------------
{
  const a = ALERTS[0];
  const xml = toCap(a, [
    { language: "en-IN", headline: a.headline, description: a.description, instruction: a.instruction },
    { language: "as-IN", headline: "অসমীয়া", description: "…", instruction: ["এতিয়াই যাওক।"] },
  ]);
  const p = parseCap(xml);
  ok("round trip keeps identifier", p.identifier === a.identifier, p.identifier);
  ok("round trip keeps severity", p.info?.severity === a.severity);
  ok("round trip keeps instructions", p.info?.instruction.length === a.instruction.length, `${p.info?.instruction.length} vs ${a.instruction.length}`);
  ok("emitted document carries 2 language blocks", p.infoBlockCount === 2, String(p.infoBlockCount));
}

console.log(`\n  ${fails === 0 ? "all CAP checks pass" : `${fails} check(s) failed`}`);
process.exit(fails ? 1 : 0);
