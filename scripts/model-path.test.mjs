/* Exercises the REAL /api/ask model path end to end against a stub that speaks
 * the OpenAI wire protocol. Everything downstream of the network call is the
 * production code: the same route, the same prompt assembly, the same JSON
 * parse, the same guard.
 *
 * Two cases matter:
 *   1. a well-behaved completion is accepted and reaches the reader
 *   2. a POISONED completion — an invented helpline and a water level that
 *      appears nowhere in the source — is REJECTED, and the reader gets the
 *      rule table's honest fallback instead
 *
 * Case 2 is the one that matters. It is the difference between "we told the
 * model not to" and "it cannot".
 */
import http from "node:http";
import { spawn } from "node:child_process";

const PORT = 4599;
let mode = "good";

const COMPLETION = (content) => ({
  id: "chatcmpl-stub", object: "chat.completion", created: Date.now() / 1000 | 0,
  model: "gpt-4o-mini",
  choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
});

const GOOD = JSON.stringify({
  answer: "The Dhansiri is at 79.42 m, above the danger level of 78.60 m. Leave for higher ground.",
  action_steps: ["Take your ID papers in a sealed bag.", "Switch off the main electricity switch."],
  avoid: ["Do not drive through moving water."],
  helplines: ["112"],
});

const POISONED = JSON.stringify({
  answer: "Water has reached 91.5 m. You are safe where you are. Call our control room on 9998887777.",
  action_steps: ["Wait at home for rescue."],
  avoid: [],
  helplines: ["9998887777"],
});

const stub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(COMPLETION(mode === "good" ? GOOD : POISONED)));
  });
});
await new Promise((r) => stub.listen(PORT, r));

// This test spawns its OWN production server, pointed at the stub above via
// OPENAI_BASE_URL and given a dummy key. It deliberately does not reuse an
// already-running server: that server's environment is ambient, so the test
// would silently start calling the real OpenAI API and stop testing the thing
// it exists to test. A test whose result depends on who started the server is
// not a test.
const APP_PORT = 4600;
const BASE = `http://localhost:${APP_PORT}`;

const app = spawn("npx", ["next", "start", "-p", String(APP_PORT)], {
  cwd: new URL("..", import.meta.url).pathname,
  env: {
    ...process.env,
    OPENAI_API_KEY: "sk-stub-for-this-test-only",
    OPENAI_BASE_URL: `http://127.0.0.1:${PORT}/v1`,
    // Next loads .env.local after this, but does not override values already
    // present in process.env, so the real key cannot leak back in.
  },
  stdio: "ignore",
});

const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

if (!(await ready())) {
  console.log("  FAIL  could not start a test server on port " + APP_PORT);
  app.kill("SIGKILL");
  stub.close();
app.kill("SIGKILL");
  process.exit(1);
}

const ask = async (question) => {
  const r = await fetch(`${BASE}/api/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, districtId: "golaghat", lang: "en" }),
  });
  return r.json();
};

// A question no rule-table intent matches, so it must reach the model.
// Verified against classify(): this matches no rule-table intent, so it is
// guaranteed to reach the model rather than being answered deterministically.
const UNMATCHED = "my roof is made of tin, is that a problem";

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
};

mode = "good";
let r = await ask(UNMATCHED);
check("well-behaved completion is accepted", r.answer?.source === "model" && /79\.42/.test(r.answer.text),
  `source=${r.answer?.source} rejected=${r.rejected ?? "-"}`);
check("accepted answer keeps its real helpline", (r.answer?.helplines || []).includes("112"),
  `helplines=${JSON.stringify(r.answer?.helplines)}`);

mode = "poison";
r = await ask(UNMATCHED);
check("poisoned completion is REJECTED", r.answer?.source !== "model" && Boolean(r.rejected),
  `rejected=${r.rejected}`);
// Scope these to what the READER is shown. `r.rejected` deliberately carries
// the reason ("forbidden-claim:you are safe") as diagnostic metadata — that
// visibility is the honesty feature, not a leak.
const shown = JSON.stringify(r.answer);
check("invented helpline never reaches the reader", !shown.includes("9998887777"));
check("invented water level never reaches the reader", !shown.includes("91.5"));
check("'you are safe' never reaches the reader", !/you are safe/i.test(shown));
check("the rejection reason IS surfaced for inspection", /forbidden-claim|unsourced-number/.test(String(r.rejected)),
  String(r.rejected));
check("reader gets the honest fallback instead", /could not match|not match/i.test(r.answer?.text || ""),
  (r.answer?.text || "").slice(0, 60));

stub.close();
app.kill("SIGKILL");
console.log(`\n  ${pass}/${pass + fail} model-path checks pass`);
process.exit(fail ? 1 : 0);
