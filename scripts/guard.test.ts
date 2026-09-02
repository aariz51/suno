/* The guard is the reason the model can be trusted with the job at all, so it
 * has a test rather than a claim. Run: npx tsx scripts/guard.test.ts
 * Every case below is a real failure mode of an LLM asked to rewrite an
 * emergency bulletin: helpfully rounding a measurement, inventing a helpline,
 * or reassuring the reader. All of them must be rejected. */
import { guard } from "../lib/guard";
const corpus = "River Dhansiri reading 79.42 m against danger level 78.60 m rising 11 cm/hr";
const cases: [string, unknown][] = [
  ["invented helpline",      { answer: "Call 9998887777 now.", action_steps: [], avoid: [], helplines: ["9998887777"] }],
  ["unsourced measurement",  { answer: "Water is at 91.5 m.", action_steps: [], avoid: [], helplines: [] }],
  ["safety verdict",         { answer: "You are safe now.", action_steps: [], avoid: [], helplines: [] }],
  ["claims dispatch",        { answer: "Help is on the way.", action_steps: [], avoid: [], helplines: [] }],
  ["all-clear",              { answer: "The danger has passed.", action_steps: [], avoid: [], helplines: [] }],
  ["VALID grounded answer",  { answer: "River Dhansiri is at 79.42 m, above the danger level of 78.60 m. Leave for higher ground.", action_steps: ["Take your ID papers."], avoid: ["Do not drive through water."], helplines: ["112"] }],
];
for (const [name, payload] of cases) {
  const r = guard(payload, corpus);
  console.log((r.ok ? "  ACCEPTED " : "  REJECTED ").padEnd(12), name.padEnd(24), r.ok ? "" : "→ " + r.reason);
}

const failures = cases.filter(([, p]) => {
  const r = guard(p, corpus);
  return r.ok !== String(p && (p as { answer?: string }).answer).includes("79.42");
});
console.log(failures.length ? `\n  ${failures.length} UNEXPECTED` : "\n  all cases behaved as specified");
process.exit(failures.length ? 1 : 0);
