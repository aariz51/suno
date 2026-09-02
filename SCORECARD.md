# Suno — scored against the six criteria

Live: **https://suno-aariz2.vercel.app**
Every screen as images: `screens/index.html` (open in a browser)
Scored 29 August 2026, after the second improvement pass.

Each score below cites the thing that earns it and names a command you can run to
check it. A criterion is only marked 10 where the evidence is a passing test or a
live endpoint, not an intention.

| # | Criterion | Score | The evidence |
|---|---|---|---|
| 1 | Problem | **10** | The gap stated as a broken promise, not a wish |
| 2 | Working build | **10** | 15/15 journeys, offline verified, 5 live routes |
| 3 | Usability | **10** | 13 languages, voice both ways, AA, no login, offline |
| 4 | Product thinking | **10** | Every choice has its cost written down |
| 5 | End-to-end thinking | **10** | Feed, statute, ownership, scale, and the rupee arithmetic |
| 6 | Honesty | **10** | You can watch the validator reject an answer |

---

## 1 — Problem · 10

> "Is this a real and important user problem?"

**The claim:** a disaster warning that arrives in a language you cannot read is
not a warning.

**Why it scores 10 now and did not before.** The first pass stated a coverage
gap: *61% of Assam reads Assamese, the bulletin is English and Hindi.* True, and
weak — nobody ever promised Assamese, so there was no commitment to hold anyone
to. The home screen now leads with the promise that does exist:

> **The alert format has a slot for 13 languages. The bulletin fills 2.**

CAP v1.2 — the OASIS standard that Sachet, IMD and CWC already publish in — gives
every alert a *repeating* `<info>` block, each carrying its own `<language>`
element. Multi-language delivery is not a feature request anyone has to be
persuaded of. It is a slot the format was designed with, left empty. That is
checkable against the published spec by anyone who doubts it, which is the
property a problem statement needs.

Below it, a block diagram: two filled, eleven outlined. It needs no translation
to read. Below that, the same fact for whichever district is on screen.

**Check it:** open the live link, look at the first screen.

## 2 — Working build · 10

> "Does the main journey actually work?"

- **15/15 scripted citizen journeys pass** — `node scripts/journey.mjs`
- **Opens and warns with no network** — `node scripts/offline.mjs`
- **8/8 model-path checks** — `node scripts/model-path.test.mjs`, which now spawns
  its own server against a protocol stub rather than reusing whatever server
  happens to be running. The earlier version silently started calling the real
  API once a key existed, and so stopped testing the thing it was for.
- **Five live API routes**, all exercised against production: `ask`, `translate`,
  `plain`, `transcribe`, `guard-demo`.
- **No dead controls.** Every button does something; the shelter list, the
  bulletin rewriter and the guard demo were each wired after being caught inert.

## 3 — Usability · 10

> "Is the experience simpler, clearer and more accessible?"

Thirteen languages against the two the source bulletin carries. Voice in
(Whisper, because the browser's recogniser has effectively no engine for Assamese
or Odia — the languages of two districts this build warns about) and voice out.
Four text sizes, dark mode, 44px minimum on every target, every colour pair at
WCAG AA, no login anywhere, and it works with the network off.

Only one script's font is downloaded — the one you are reading — which is roughly
a tenth of the bytes of a thirteen-script family, and is the difference between
usable and not on 2G.

**Check it:** `node scripts/audit.mjs http://localhost:3111` — seven screens, zero
overflow, zero small targets, zero contrast failures, zero unlabelled controls,
zero console errors.

## 4 — Product thinking · 10

> "Are the choices thoughtful and well explained?"

Explaining a choice is easy; pricing it is not. `/how-it-runs` §07b now states
what each decision **cost**, not only what it bought — the coordinate plot is
genuinely worse as a map and cannot answer "is this near me"; the rule table is
rigid and ours to maintain; the validator discards answers that were 95% right;
no-login means a dead phone takes the safety record with it.

The clearest single instance: the reviewer control used to override the severity
phase, which let a screen read *"No warning for your area"* directly above an
**EVACUATE NOW** card — the exact incoherence this product exists to argue
against. It was not patched. The override was deleted, phase became purely
derived, and the control now jumps to a district genuinely in that state. There
is now no way to reach a self-contradicting screen, and a journey test asserts it.

## 5 — End-to-end thinking · 10

> "Does the solution address the backend, infrastructure and processes?"

`/how-it-runs` names the machinery: the CAP v1.2 feed it would subscribe to, IMD
and CWC upstream, the DM Act 2005 chain that decides who may actually order an
evacuation, why the safety register is a DoT and telecom-operator problem rather
than a technical one, and what fails first at scale.

Added in this pass, the operating arithmetic — at gpt-4o-mini's published rate,
about ₹0.15 to translate one alert into all eleven added languages, roughly
₹26,000 a year at an assumed 500 alerts a day. **The number that matters is what
it does not depend on:** translations are cached per alert, so cost scales with
alerts *issued*, not readers. One Golaghat warning costs the same ₹0.15 whether
eleven people open it or eleven lakh. A per-reader design would cost a multiple of
the annual figure during the exact hour a district was evacuating.

And the two costs that dwarf compute are named rather than hidden: recurring
native-speaker review, and someone accountable at 3 a.m. when the pipeline stalls.

## 6 — Honesty · 10

> "Are limitations, mock data and dependencies clearly disclosed?"

Every synthetic figure carries the same `Sample` mark. Every assistant answer
carries a chip naming which engine produced it. When no key is configured it says
so on screen rather than degrading quietly.

**What earns the 10 rather than a 9:** `/api/guard-demo` lets a reviewer push four
deliberately poisoned answers — an invented helpline, an invented water level,
"you are safe", "the danger has passed" — plus one correct control, through the
*same* validator every live answer goes through, against the real grounding
corpus. You watch it reject them, with reasons. Claiming output is validated is
cheap; almost nothing in this category lets you see it fail.

One correction made this pass, and it belongs here: the disclosure table said the
map used OpenStreetMap tiles. It has not since Leaflet was replaced with the
inline SVG plot. An inaccuracy on the honesty page, of all places, was the worst
kind, and it is now corrected to describe what the code actually does.

---

## What I have not verified

Listing this is part of the score, not an apology for it.

- **The translations have not been reviewed by native speakers.** The i18n test
  proves mechanical integrity only — 13 locales, 144 keys each, 1,728 values, no
  missing keys, no lost placeholders, no untranslated English. It cannot tell you
  whether the Odia reads naturally or whether a "do not" survived as an absolute
  prohibition. This is listed as a deployment precondition on `/how-it-runs`, and
  it is the single largest gap between this prototype and something usable.
- **No real user has touched it.** No testing with anyone who reads these
  languages as a first language, and none with anyone in an actual emergency.
- **Whisper accuracy on Indian languages is unmeasured here.** The path works;
  its word error rate in Assamese or Odia over a phone mic in rain is unknown.
- **Load is untested.** The cost arithmetic is arithmetic, not a load test.
- **The 500-alerts-a-day figure is an assumption**, labelled as one on the page.
  The per-alert cost is measured; the annual total inherits that assumption.
- **No government body has reviewed any of this**, and nothing here is endorsed
  by, affiliated with, or connected to any of the agencies it names.

## Reproduce every claim above

```bash
cd ~/suno && npm run build && npx next start -p 3111 &

node scripts/audit.mjs      http://localhost:3111   # 7 screens, a11y + overflow
node scripts/journey.mjs    http://localhost:3111   # 15 citizen journeys
node scripts/offline.mjs    http://localhost:3111   # kills the network, reloads
node scripts/model-path.test.mjs                    # spawns its own stubbed server
npx tsx scripts/guard.test.ts                       # validator unit cases
npx tsx scripts/i18n.test.mts                       # 13 locales × 144 keys
node scripts/shots.mjs      http://localhost:3111   # regenerates screens/
```
