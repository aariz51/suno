# Suno — the warning, in your language

**Live: [suno-eta.vercel.app](https://suno-eta.vercel.app)** · no login, nothing to install

India issues disaster warnings in two languages. CAP v1.2, the alert format the
agencies already publish in, carries one repeating `<info>` block per language.
The slot exists and is left empty.

A flood warning reaches Golaghat in English and Hindi. Sixty-one percent of Assam
reads Assamese.

Suno fills the slot: the same warning in 13 Indian languages, read aloud, working
with no network at all.

> **This is an independent prototype and not a government service.** Every
> warning, shelter and measurement in it is synthetic. It decides nothing. In an
> emergency in India, call 112.

---

## What it does

| | |
|---|---|
| **13 languages** | Hand-written locale files, not machine-dumped. Choosing a district chooses the language, so nobody hunts a menu during a flood. One script's font is loaded, not thirteen. |
| **Voice in and out** | `whisper-1` for speech in languages the browser's own recogniser cannot manage, including Assamese and Odia. Answers are read back aloud. |
| **Severity owns the page** | At Level 4 the ground itself turns red and the header collapses. A red card in a white page can be scrolled past. A red page cannot. |
| **Works offline** | Installable, and it opens and warns with the network switched off. It names the time of the last update it holds rather than presenting stale data as current. |
| **A rule table answers first** | Twenty common questions never reach a model. Identical input returns an identical answer, with no key and no network. |
| **A validator you can watch fire** | Every model reply is checked. No phone number outside the allowlist, no measurement absent from the source, no sentence telling a person they are safe. |
| **A real CAP v1.2 parser** | Paste a genuine bulletin into `/pipeline` and it parses. Not a mock. |

## The three pages

- **[`/app`](https://suno-eta.vercel.app/app)** — the warning portal. This is the product.
- **[`/pipeline`](https://suno-eta.vercel.app/pipeline)** — the machinery: CAP ingestion, an independent risk scan that publishes where it disagrees with the official feed, and a delivery model for what each channel actually reaches.
- **[`/how-it-runs`](https://suno-eta.vercel.app/how-it-runs)** — the engineering note: the feed it would subscribe to, who is legally allowed to order an evacuation, what breaks at national scale, and what it would cost.

---

## How the model is used

OpenAI models do two narrow jobs, and are forbidden from several others.

**Job one — translate.** `gpt-4o-mini` renders text a deterministic path has
already produced into the reader's language, line for line. It may not merge,
split, summarise, reorder or soften a line, and a translation that changes a
helpline number or the number of lines is discarded rather than shown.

**Job two — answer an unrecognised question.** Only text the rule table did not
match reaches the model, grounded on that district's warnings, shelters and
guidance and nothing else.

**What it may never do**, enforced by [`lib/guard.ts`](lib/guard.ts) on every
reply rather than by the prompt alone:

- output a phone number outside the ten-number allowlist
- output a measurement, depth, speed or time absent from the source
- tell a person they are safe, or that a warning has ended
- reorder the steps of an evacuation instruction
- invent a shelter, a place or an agency

A reply that breaks one of those is thrown away, and the reason is shown on
screen. **With no `OPENAI_API_KEY` the app still runs** on its rule table and
says so in the interface.

```
npx tsx scripts/guard.test.ts        # the validator, against poisoned replies
node scripts/model-path.test.mjs     # the whole model path, with a stubbed model
```

---

## Running it

```bash
npm install
cp .env.example .env.local     # optional: add OPENAI_API_KEY
npm run dev
```

Open <http://localhost:3000>. It works with no key. Add one and the translation,
the open-ended assistant and speech recognition switch on; the interface labels
which path produced every answer either way.

### The test suites

Each exists because something broke, or because a claim on the site needs to be
checkable rather than trusted.

```bash
npm run build && npx next start -p 3111    # then, against it:

node scripts/audit.mjs        http://localhost:3111   # contrast, tap targets, overflow, per screen
node scripts/journey.mjs      http://localhost:3111   # 15 citizen journeys end to end
node scripts/offline.mjs      http://localhost:3111   # opens and warns with no network
node scripts/desktop.test.mjs http://localhost:3111   # 5 viewports, rail vs bottom bar
node scripts/motion.test.mjs  http://localhost:3111   # motion runs, and is never load-bearing
node scripts/lang-leak.test.mjs http://localhost:3111 # no English left in any locale

npx tsx scripts/cap.test.ts    # 19 checks against real CAP documents
npx tsx scripts/guard.test.ts  # the validator
npx tsx scripts/i18n.test.mts  # 13 locales, key parity, no untranslated strings
```

---

## Design notes

Decisions worth knowing before changing something.

**No runtime CDN.** Fonts are self-hosted through `next/font`, every icon is
hand-drawn inline SVG, and the map is an inline SVG coordinate plot rather than a
tile layer. An icon library loaded from a CDN is a network dependency on the one
screen that must render when the network is failing, and ad blockers and
corporate proxies eat them routinely.

**The map depicts no boundaries.** It plots latitude and longitude and says so.
An independent prototype has no business rendering a version of India's borders,
and a wrong one would be a real problem rather than a cosmetic one.

**Severity is derived, never set.** There is no toggle that can put the app in
"calm" while the district it is showing has a live Level 4 warning. The reviewer
controls jump to districts that genuinely are in that state.

**Motion is never load-bearing.** Reveal animations are applied only after an
inline script confirms JavaScript is running. With no JS nothing animates and
everything is simply visible, which is the only acceptable failure mode on a page
about warnings. `scripts/motion.test.mjs` asserts it from both ends.

**Colour is functional.** The only saturated hues in the system are the four
severity levels. Everything else is ink on paper.

---

## What is real, and what is not

**Synthetic:** every warning, every shelter, every water level, wind speed,
rainfall figure and temperature, the safety register, and the six-digit
verification code shown on screen instead of sent by SMS. Sender addresses end in
`.invalid`, a reserved TLD that can never resolve.

**Real:** the ten helpline numbers, the districts and their coordinates, the
interface text in 13 languages, your device's location if you allow it, the
OpenAI calls, and the CAP parser.

**Simulated and labelled as such:** live Sachet ingestion, the Open-Meteo pull
behind the risk scan, and every delivery channel. Live ingestion of a government
feed needs an agreement; cell broadcast needs an authority designated under the
Disaster Management Act 2005.

The full item-by-item account is on
[`/how-it-runs`](https://suno-eta.vercel.app/how-it-runs).

---

## Built with

Next.js 15 · React 19 · Tailwind v4 · OpenAI (`gpt-4o-mini`, `whisper-1`)

No state library, no component library, no animation runtime, no map library, and
no XML parser. The CAP reader is a hundred lines because a dependency is a
supply-chain decision and this project's argument is partly about what it does
not depend on.

## Contributing

Issues and pull requests are welcome. Two things to know:

1. **Do not add a government logo, emblem, or masthead.** `scripts/audit.mjs`
   fails if those strings reappear, and it is there deliberately.
2. **Translations are the most valuable contribution.** The 13 locales in
   `lib/i18n/locales/` are mechanically verified for key parity, but mechanical
   integrity is not fluency. Native-speaker review of any locale is worth more
   than a feature.

## Licence

[MIT](LICENSE).
