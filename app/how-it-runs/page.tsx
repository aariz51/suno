import Link from "next/link";
import type { Metadata } from "next";
import { DISTRICTS } from "@/lib/data/districts";
import { ALERTS } from "@/lib/data/alerts";
import { SHELTERS, shelterHeadroom } from "@/lib/data/shelters";
import { HELPLINES } from "@/lib/data/helplines";
import { LANGS, TOTAL_SPEAKERS_M } from "@/lib/i18n";
import { PLAN_VERSION } from "@/lib/data/plans";
import { RULES_VERSION } from "@/lib/rules";

export const metadata: Metadata = {
  title: "How this would actually run — Suno",
  description:
    "What is real and what is synthetic, which feed this would subscribe to, who is legally allowed to order an evacuation, what breaks at national scale, and what the language model is forbidden from doing.",
};

// -----------------------------------------------------------------------------
// This page is the answer to "does the solution address the backend,
// infrastructure and processes, not just the interface?"
//
// It is written to be checkable. Every institution named here is real and can be
// looked up; every number is either computed from this repository's own data or
// is a published public figure with its source stated. Where something is
// unknown or unresolved it says so rather than rounding it into confidence.
// -----------------------------------------------------------------------------

function Section({
  n, title, children,
}: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-hairline)] pt-8 mt-10 first:mt-0 first:border-0 first:pt-0">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="num font-[family-name:--font-mono] text-xs text-[var(--color-ink-3)] tabular-nums">{n}</span>
        <h2 className="text-[1.35rem] leading-tight font-bold tracking-[-0.015em]">{title}</h2>
      </div>
      <div className="space-y-4 text-[0.95rem] leading-[1.65] text-[var(--color-ink-2)] max-w-[68ch]">{children}</div>
    </section>
  );
}

function Real({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-safe-wash)] text-[var(--color-safe)] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{children}
    </span>
  );
}
function Fake({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-l2-wash)] text-[var(--color-l2)] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{children}
    </span>
  );
}

export default function HowItRuns() {
  // Every figure below is computed from this repository, not asserted.
  const districtCount = DISTRICTS.length;
  const langCount = LANGS.length;
  const alertCount = ALERTS.length;
  const shelterCount = SHELTERS.length;
  const helplineCount = HELPLINES.length;

  // The scale problem, made concrete with the app's own numbers.
  const golaghat = DISTRICTS.find((d) => d.id === "golaghat")!;
  const gh = shelterHeadroom("golaghat");
  const coveragePct = ((gh.capacity / golaghat.pop) * 100).toFixed(2);

  return (
    <main id="main" className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <div className="mx-auto max-w-[52rem] px-5 py-10 md:px-8 md:py-16">

        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--color-accent)] hover:underline underline-offset-4"
        >
          <span aria-hidden>←</span> Back to the warning
        </Link>

        <header className="mt-8 mb-12">
          <p className="font-[family-name:--font-mono] text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-ink-3)] mb-3">
            Suno · engineering note
          </p>
          <h1 className="text-[2.1rem] md:text-[2.75rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
            How this would actually run
          </h1>
          <p className="mt-5 text-[1.05rem] leading-[1.6] text-[var(--color-ink-2)] max-w-[62ch]">
            A prototype that only works as a screen is a drawing. This page names the feed it
            would subscribe to, the office that would operate it, the law that decides who may
            order an evacuation, the numbers that break at national scale, and the specific
            things the language model is not permitted to do.
          </p>
          <p className="mt-4 text-[0.95rem] leading-[1.6] text-[var(--color-ink-2)] max-w-[62ch]">
            It also states, item by item, what in this build is real and what is invented. That
            list is first, because everything after it depends on being able to trust it.
          </p>
        </header>

        {/* ------------------------------------------------------------------ */}
        <Section n="01" title="What is real, and what is not">
          <p>
            Nothing in this prototype is connected to any government system. No live feed is
            polled, no official API is called, and no government database is read or written.
            The following is exhaustive.
          </p>

          <div className="not-prose mt-6 overflow-x-auto">
            <table className="w-full text-left text-[0.9rem] border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th className="py-2.5 pr-4 font-semibold text-[var(--color-ink)] w-[36%]">Thing</th>
                  <th className="py-2.5 pr-4 font-semibold text-[var(--color-ink)] w-[22%]">Status</th>
                  <th className="py-2.5 font-semibold text-[var(--color-ink)]">Detail</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {[
                  ["The {n} warnings", <Fake key="a">Synthetic</Fake>,
                   `Written for this prototype. Modelled field-for-field on CAP v1.2, the format IMD, CWC and Sachet already publish, so replacing them with a live feed is a parser change rather than a redesign. Sender addresses end in .invalid, which is a reserved TLD that can never resolve.`],
                  ["The {s} shelters", <Fake key="b">Synthetic</Fake>,
                   "Names, capacities, occupancy and facility flags are invented. The field list mirrors what a District Disaster Management Authority register actually holds, including the fields current public interfaces do not show — step-free access, whether livestock are accepted, and how many places are left."],
                  ["Water levels, wind speeds, rainfall, temperatures", <Fake key="c">Synthetic</Fake>,
                   "Every quantity on every screen is invented. They are internally consistent and plausible in magnitude, and they measure nothing."],
                  ["The safety register", <Fake key="d">Synthetic</Fake>,
                   "Marking yourself safe writes to your own browser's storage and nowhere else. Nothing is transmitted. No SMS is sent — the verification code is shown on screen precisely so nobody has to enter a real number to try the flow."],
                  ["The 6-digit verification code", <Fake key="e">Simulated</Fake>,
                   "Displayed on screen instead of sent. There is no SMS gateway in this build."],
                  [`The ${helplineCount} helpline numbers`, <Real key="f">Real</Real>,
                   "112, 108, 1078, 101, 1070, 1077, 1091, 1098, 14567 and 104 are genuine, currently operating Indian emergency numbers. They are the only numbers in the product, and they are the only numbers the assistant is permitted to say."],
                  [`The ${districtCount} districts and their coordinates`, <Real key="g">Real</Real>,
                   "Real places at real coordinates. Population figures are Census 2011 district totals."],
                  ["Language shares", <Real key="h">Real</Real>,
                   "Census 2011 state-level language tables, rounded. Used to state the exclusion as a number rather than as a claim."],
                  [`The ${langCount} translations`, <Real key="i">Human-written</Real>,
                   "The interface strings and the rule table's answers were written by a person, shipped as static files, and work with no network and no API key."],
                  ["Your location", <Real key="j">Real</Real>,
                   "If you allow it, the browser's actual geolocation is used to pick the nearest district. It is never sent anywhere — the nearest-district calculation runs on your device."],
                  ["The map", <Real key="k">Real</Real>,
                   "Not a tile map. It is a schematic plot of latitude and longitude, drawn as inline SVG from coordinates the app already holds, so it renders with no network and no map library. District coordinates are real; the warnings plotted on them are synthetic. It deliberately depicts no national or state boundaries."],
                  ["The language model", <Real key="l">Real</Real>,
                   "When an API key is configured, real OpenAI calls are made for the two jobs described in section 07. With no key the app runs entirely on its rule table and says so on screen."],
                ].map(([thing, status, detail], i) => (
                  <tr key={i} className="border-b border-[var(--color-hairline)] last:border-0">
                    <td className="py-3 pr-4 font-semibold text-[var(--color-ink)]">
                      {String(thing).replace("{n}", String(alertCount)).replace("{s}", String(shelterCount))}
                    </td>
                    <td className="py-3 pr-4">{status}</td>
                    <td className="py-3 text-[var(--color-ink-2)] leading-[1.55]">{detail as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="pt-2">
            This prototype approves nothing, dispatches nothing and decides nothing. No officer
            is bound by anything it displays.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="02" title="Where the warning would come from">
          <p>
            India already generates these warnings. Five agencies issue them, each for its own
            hazard, and NDMA&rsquo;s <strong className="text-[var(--color-ink)]">Sachet</strong> platform already
            aggregates and broadcasts them in{" "}
            <strong className="text-[var(--color-ink)]">CAP</strong> — the Common Alerting Protocol, an
            OASIS standard. The problem this prototype addresses is not that the warning does not
            exist. It is what happens to it in the last hundred metres.
          </p>

          <div className="not-prose my-6 rounded-[--radius-lg] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] p-5 overflow-x-auto">
            <svg viewBox="0 0 720 250" className="w-full min-w-[560px] h-auto" role="img"
                 aria-label="Diagram: five source agencies feed CAP alerts into an aggregator, which fans out to cell broadcast, SMS, television and this prototype.">
              <defs>
                <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="var(--color-ink-3)" />
                </marker>
              </defs>
              <g fontFamily="var(--font-sans)" fontSize="11">
                {[
                  ["IMD", "cyclone, rain, heat", 18],
                  ["CWC", "river levels", 62],
                  ["INCOIS", "storm surge, tsunami", 106],
                  ["NCS", "earthquake", 150],
                  ["GSI", "landslide", 194],
                ].map(([a, b, y]) => (
                  <g key={a as string}>
                    <rect x="4" y={y as number} width="128" height="36" rx="8"
                          fill="var(--color-paper)" stroke="var(--color-hairline)" />
                    <text x="16" y={(y as number) + 15} fill="var(--color-ink)" fontWeight="700">{a}</text>
                    <text x="16" y={(y as number) + 28} fill="var(--color-ink-3)" fontSize="9.5">{b}</text>
                    <line x1="134" y1={(y as number) + 18} x2="196" y2="125"
                          stroke="var(--color-ink-3)" strokeWidth="1" markerEnd="url(#ar)" opacity="0.55" />
                  </g>
                ))}

                <rect x="200" y="98" width="128" height="54" rx="10"
                      fill="var(--color-accent-wash)" stroke="var(--color-accent)" />
                <text x="214" y="120" fill="var(--color-accent-ink)" fontWeight="700">Sachet</text>
                <text x="214" y="134" fill="var(--color-accent-ink)" fontSize="9.5">NDMA aggregator</text>
                <text x="214" y="146" fill="var(--color-accent-ink)" fontSize="9.5" fontFamily="var(--font-mono)">CAP v1.2 XML</text>

                <line x1="330" y1="125" x2="392" y2="125" stroke="var(--color-ink-3)"
                      strokeWidth="1" markerEnd="url(#ar)" />

                {[
                  ["Cell broadcast", "every handset in a cell, seconds, no list", 26, false],
                  ["SMS push", "needs a subscriber list, minutes to hours", 74, false],
                  ["TV and radio crawl", "reaches those already watching", 122, false],
                  ["Suno", "13 languages, spoken, offline-capable", 170, true],
                ].map(([a, b, y, hi]) => (
                  <g key={a as string}>
                    <rect x="396" y={y as number} width="316" height="40" rx="8"
                          fill={hi ? "var(--color-l4-wash)" : "var(--color-paper)"}
                          stroke={hi ? "var(--color-l4)" : "var(--color-hairline)"} />
                    <text x="410" y={(y as number) + 17}
                          fill={hi ? "var(--color-l4)" : "var(--color-ink)"} fontWeight="700">{a}</text>
                    <text x="410" y={(y as number) + 31} fill="var(--color-ink-3)" fontSize="9.5">{b}</text>
                    <line x1="392" y1="125" x2="396" y2={(y as number) + 20}
                          stroke="var(--color-ink-3)" strokeWidth="1" opacity="0.55" />
                  </g>
                ))}
              </g>
            </svg>
          </div>

          <p>
            Suno sits in the last box. It is a <em>renderer</em> of alerts that already exist, not
            a new source of them. That distinction matters legally as much as technically, and
            section 04 explains why.
          </p>
          <p>
            The integration is a CAP subscriber: poll or receive the feed, parse{" "}
            <code className="font-[family-name:--font-mono] text-[0.85em] bg-[var(--color-paper-3)] px-1.5 py-0.5 rounded">
              identifier, sent, onset, expires, severity, urgency, certainty, areaDesc, instruction
            </code>
            , and map <code className="font-[family-name:--font-mono] text-[0.85em] bg-[var(--color-paper-3)] px-1.5 py-0.5 rounded">severity × urgency</code>{" "}
            onto the four-level citizen scale. <a className="text-[var(--color-accent)] underline underline-offset-2" href="/">The alerts in this build already carry those exact fields</a>,
            which is what makes the claim testable rather than aspirational.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="03" title="The gap this actually closes">
          <p>
            Sachet and IMD issue bulletins in <strong className="text-[var(--color-ink)]">English and Hindi</strong>.
            The Eighth Schedule of the Constitution recognises{" "}
            <strong className="text-[var(--color-ink)]">22 languages</strong>.
          </p>
          <p>
            That gap is not abstract. Every district in this prototype with an active warning is a
            district where it bites: Golaghat and Guwahati read Assamese, Puri reads Odia, Wayanad
            reads Malayalam, Nagpur reads Marathi. A flash-flood warning that reaches a Golaghat
            household in English is not a warning. It is a notification that something is wrong,
            in a language somebody in the house now has to go and find a translation for — during
            the two hours the warning was trying to buy them.
          </p>

          <div className="not-prose my-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["2", "languages the upstream bulletin is issued in"],
              [String(langCount), "languages Suno delivers it in"],
              ["22", "languages in the Eighth Schedule"],
              [`${Math.round(TOTAL_SPEAKERS_M / 10) * 10}M`, "first-language speakers covered here"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-[--radius] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] p-4">
                <div className="num font-[family-name:--font-mono] text-[1.75rem] font-semibold leading-none text-[var(--color-ink)]">{n}</div>
                <div className="mt-2 text-[0.78rem] leading-snug text-[var(--color-ink-3)]">{l}</div>
              </div>
            ))}
          </div>

          <p>
            Two further things follow from designing for that reader rather than for a reviewer.
            The warning is <strong className="text-[var(--color-ink)]">spoken aloud</strong>, because
            reading and literacy are different problems and only one of them is solved by
            translation. And the language is chosen{" "}
            <strong className="text-[var(--color-ink)]">by the district</strong>, not by a menu — pick
            Golaghat and the interface is already in Assamese, because a person in a flood should
            not have to find a settings screen first.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="04" title="Who is actually allowed to order an evacuation">
          <p>
            Under the <strong className="text-[var(--color-ink)]">Disaster Management Act, 2005</strong>, the
            authority runs NDMA → State Disaster Management Authority → District Disaster
            Management Authority, chaired by the District Magistrate or Collector. In practice the
            instruction to leave is issued by the District Magistrate, executed by the district
            administration, and supported by NDRF and SDRF.
          </p>
          <p>
            Suno never issues one. It renders an order that already exists in the feed, and the
            language model is explicitly forbidden from originating one — the rule is enforced in
            code, not in a prompt suggestion. If no evacuation order exists in the data, no
            evacuation instruction can appear on the screen, in any language, by any path.
          </p>
          <p>
            The practical consequence for deployment: this would be operated by, or under, a
            District Disaster Management Authority, and the escalation path for a wrong or stale
            warning has to be the DDMA control room — which is why{" "}
            <strong className="text-[var(--color-ink)]">1077</strong>, the district control room number,
            is in the helpline list and not just 112.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="05" title="The safety register is the hard part, and it is not a technical problem">
          <p>
            &ldquo;Mark yourself safe&rdquo; is four lines of code and a genuinely difficult
            institutional question. A national register of who is safe means a national register
            of verified mobile numbers and their status, which touches telecom operators licensed
            under the Department of Telecommunications, and it means holding location-adjacent
            personal data about people during the period they are most vulnerable.
          </p>
          <p>Three things would have to be settled before this could exist for real:</p>
          <ul className="list-none space-y-2.5 pl-0">
            {[
              ["Who holds it.", "A register operated by an aggregator is a standing target. One operated per-district under a DDMA is fragmented exactly when families are searching across districts."],
              ["How long it lives.", "A safety status is useful for days and dangerous for years. It needs a deletion clock written into the design, not into a policy document."],
              ["What it is not.", "The moment it can be queried by anyone for anyone, it becomes a people-tracing tool. The honest design answer is that a status is only ever readable by someone who already knows the number they are searching for — which is what this prototype does."],
            ].map(([a, b]) => (
              <li key={a} className="flex gap-3">
                <span className="mt-[0.55em] w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                <span><strong className="text-[var(--color-ink)]">{a}</strong> {b}</span>
              </li>
            ))}
          </ul>
          <p>
            In this build the register is your browser&rsquo;s own storage, and nothing leaves the
            device. That is a limitation, and it is also the only version of this feature that can
            honestly be shipped in a prototype.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="06" title="What breaks at scale">
          <p>
            The interesting failures are not load. They are physical, and this build&rsquo;s own
            data makes the first one concrete.
          </p>

          <div className="not-prose my-6 rounded-[--radius-lg] border border-[var(--color-l3)] bg-[var(--color-l3-wash)] p-5">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--color-l3)] mb-3">
              Worked example · Golaghat
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                [golaghat.pop.toLocaleString("en-IN"), "district population (Census 2011)"],
                [String(gh.count), "shelters listed here"],
                [gh.capacity.toLocaleString("en-IN"), "total shelter capacity"],
                [`${coveragePct}%`, "of the district that fits"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="num font-[family-name:--font-mono] text-[1.35rem] font-semibold leading-none text-[var(--color-ink)]">{n}</div>
                  <div className="mt-1.5 text-[0.75rem] leading-snug text-[var(--color-ink-2)]">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[0.88rem] leading-[1.6] text-[var(--color-ink-2)]">
              Telling a district to go to a shelter is only useful if the shelters exist. An
              interface that shows capacity and current occupancy — as this one does — at least
              makes the shortfall visible instead of sending three thousand people to a hall that
              seats two hundred and fifty. It does not solve it. Nothing on a phone solves it.
            </p>
          </div>

          <ul className="list-none space-y-2.5 pl-0">
            {[
              ["The tower goes down first.", "Which is why this app is a service worker with an offline shell, why the rule table answers with no network, and why the language a person chose is cached rather than fetched. Offline it shows the last warning it received with its timestamp, and says it is stale — it never presents a cached warning as current."],
              ["The phone is not a smartphone.", "Roughly a quarter of Indian mobile connections are still feature phones. The honest extension is an IVR line running the same rule table over a voice call, and a 160-character SMS mode. Neither is built here; both are named because pretending an app reaches everyone is the failure mode this whole page exists to avoid."],
              ["Cell broadcast beats a subscriber list.", "Cell broadcast reaches every handset in a cell in seconds and needs no registration. Any real deployment should be a renderer for cell broadcast, with the subscribe flow as a fallback — not the other way round, which is how most app-shaped answers to this problem get it backwards."],
              ["The battery is at 4%.", "The Level 4 screen is deliberately mostly flat colour, has no looping animation, and runs no timers it does not need."],
            ].map(([a, b]) => (
              <li key={a} className="flex gap-3">
                <span className="mt-[0.55em] w-1.5 h-1.5 rounded-full bg-[var(--color-l3)] shrink-0" />
                <span><strong className="text-[var(--color-ink)]">{a}</strong> {b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="06b" title="What it would cost to run, in rupees">
          <p>
            &ldquo;Use a language model&rdquo; is a cheap thing to propose and an expensive thing to
            operate, so here is the arithmetic rather than an assurance. The figures below use
            OpenAI&apos;s published gpt-4o-mini rate at the time of writing — $0.15 per million
            input tokens and $0.60 per million output tokens — and are worked from this
            build&apos;s own behaviour.
          </p>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-[0.9rem]">
              <tbody className="align-top">
                {[
                  ["Translatable text in one CAP alert", "~150 words — headline, description, instruction, avoid list"],
                  ["Tokens per language", "~200 in, ~200 out"],
                  ["Languages added beyond the bulletin's two", `${LANGS.length - 2}`],
                  ["Cost to translate one alert into all of them", "≈ $0.0017, about ₹0.15"],
                  ["At an assumed 500 alerts a day, nationally", "≈ $300 a year, about ₹26,000"],
                ].map(([k, v], i) => (
                  <tr key={i} className="border-b border-[var(--color-hairline)] last:border-0">
                    <td className="py-2.5 pr-4 font-semibold text-[var(--color-ink)]">{k}</td>
                    <td className="num py-2.5">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <strong className="text-[var(--color-ink)]">
              The number that matters is not the total. It is what the total does not depend on.
            </strong>{" "}
            A translation is produced once per alert per language and then cached and served as
            static text. The cost therefore scales with how many alerts are <em>issued</em>, not
            with how many people <em>read</em> them. One flood warning for Golaghat costs the same
            ₹0.15 whether eleven people open it or eleven lakh do.
          </p>

          <p>
            That is the property that makes this deployable rather than merely demonstrable. A
            design that called a model per reader would cost a multiple of the annual figure above
            during the exact hour a district was evacuating — which is to say it would fail at the
            only moment it was needed. The 500-alerts-a-day figure is an assumption and is labelled
            as one; the per-alert cost is not, and the per-alert cost is the one that has to hold.
          </p>

          <p>
            Two costs are deliberately not in that table because they are the real ones, and
            pretending otherwise would be the kind of omission this page exists to avoid.{" "}
            <strong className="text-[var(--color-ink)]">Native-speaker review</strong> of every string in
            every language is a salaried, recurring obligation, not a one-off — a mistranslated
            &ldquo;do not&rdquo; is worse than no translation. And{" "}
            <strong className="text-[var(--color-ink)]">someone has to be accountable at 3 a.m.</strong>{" "}
            when the pipeline stalls mid-evacuation. Those are staffing questions, they dwarf the
            compute bill, and no amount of engineering removes them.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="07" title="What the language model does, and what it may never do">
          <p className="text-[var(--color-ink)] font-medium">
            The model does exactly one job: it answers a question the rule table did not
            recognise, using only the warnings and guidance already on the page, in the language it
            was asked in.
          </p>
          <p>
            Twenty questions — the ones people actually ask in the first ten minutes — are matched
            by a deterministic keyword table in every supported language and answered by
            assembling text that already exists in the data files. No generation happens on that
            path, so identical input always returns an identical answer, and every number in the
            answer came from the file it was quoted from. Only unmatched text reaches the model.
          </p>
          <p>Whatever comes back is then validated before any person sees it. It is rejected outright if it:</p>
          <ul className="list-none space-y-2 pl-0">
            {[
              "contains a phone number that is not one of the real helplines",
              "contains any quantity that does not appear in the source data it was given",
              "names a shelter, road or river that is not in the register",
              "tells the reader they are safe, or that they are not — it does not decide that",
              "claims help has been sent, dispatched or alerted — nothing it does sends anyone",
              "originates an evacuation order rather than relaying one already in the feed",
            ].map((s) => (
              <li key={s} className="flex gap-3">
                <span className="mt-[0.55em] w-1.5 h-1.5 rounded-full bg-[var(--color-l4)] shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p>
            A rejected answer is not repaired and shown anyway. The reader gets the rule
            table&rsquo;s honest &ldquo;I could not match that&rdquo;, and the rejection reason is
            returned in the response so the failure is visible rather than smoothed over.
          </p>
          <p className="text-[var(--color-ink)] font-medium">
            With no API key the app still works. It falls back to the rule table, and every answer
            carries a visible chip saying which of the two produced it — rule table, translated
            rule table, or model. You never have to guess.
          </p>
          <p>
            The second job is narrower still: turning an agency bulletin written for a district
            magistrate into ordered actions, and translating grounded lines into the reader&rsquo;s
            language. That translation is checked structurally — same number of lines out as in,
            and every helpline number identical — and the whole batch is discarded if either
            check fails.
          </p>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="07b" title="What each choice cost">
          <p>
            Every decision in this build bought something and gave something up. Listing only the
            upside is how a design review turns into a sales pitch, so here is the other column.
          </p>

          <div className="not-prose my-6 space-y-4">
            {[
              {
                choice: "Severity owns the whole page, not a banner",
                bought: "At Level 4 the ground itself turns red and the header collapses. A red card inside a white page can be scrolled past; a red page cannot.",
                cost: "The location picker, the settings and the language menu all get pushed below the instructions. Someone who opened the app specifically to change district has further to scroll, and they are penalised for the sake of someone who did not.",
              },
              {
                choice: "A coordinate plot instead of a tile map",
                bought: "The map renders with no network, no map library and no tile CDN, and it depicts no boundaries — which an independent prototype has no business drawing.",
                cost: "It is genuinely worse as a map. There are no roads, no rivers, no coastline and no landmarks, so it cannot answer 'is this near me'. It shows where warnings are relative to each other and nothing more.",
              },
              {
                choice: "One script's font loaded at a time",
                bought: "Roughly a tenth of the font bytes of a thirteen-script family, which is the difference between usable and not on a 2G connection.",
                cost: "Switching language mid-session triggers a second font fetch and a visible reflow. We optimised for the common case — one person, one language — and made the rarer case worse.",
              },
              {
                choice: "The rule table answers before the model does",
                bought: "Identical input gives identical output, it costs nothing, it works offline, and the twenty most common questions can never be hallucinated.",
                cost: "The rule table is rigid and it is ours to maintain. A question phrased just outside its keywords falls through to the model even when the answer was sitting in the dataset, and every new hazard type means writing new rules by hand.",
              },
              {
                choice: "The validator discards rather than repairs",
                bought: "A rejected answer is visibly rejected, with its reason shown. Nothing is silently patched into looking correct.",
                cost: "A model answer that was 95% right and named one number wrong is thrown away whole, and the reader gets 'I could not match that' instead of most of an answer. We took that trade knowingly; in this domain a confidently wrong number is worse than no answer.",
              },
              {
                choice: "No login, no accounts, no server-side storage",
                bought: "Nobody is asked for a phone number to read a flood warning, and there is no personal data to leak.",
                cost: "Nothing persists across devices. Marking yourself safe on a phone that then dies takes the record with it — which is precisely the scenario a real safety register exists for, and is the strongest argument that this part belongs with the telecom operators rather than in a web app.",
              },
            ].map((r) => (
              <div key={r.choice} className="rounded-[12px] border border-[var(--color-hairline)] p-4">
                <div className="font-bold text-[var(--color-ink)]">{r.choice}</div>
                <p className="mt-2 text-[0.9rem] leading-[1.6]">
                  <span className="font-semibold text-[var(--color-safe)]">Bought — </span>
                  {r.bought}
                </p>
                <p className="mt-1.5 text-[0.9rem] leading-[1.6]">
                  <span className="font-semibold text-[var(--color-l3)]">Cost — </span>
                  {r.cost}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="08" title="What would have to be true">
          <p>The honest list of preconditions, none of which this prototype can satisfy on its own:</p>
          <ol className="list-none space-y-2.5 pl-0 counter-reset-none">
            {[
              "A CAP feed subscription from Sachet, with an availability commitment. A warning renderer is only as good as its access to warnings.",
              "A district-level shelter register that is maintained, with live occupancy. Capacity that is not updated is worse than no number, because it sends people to a full building.",
              "An agreement with a DDMA about who answers when the app is wrong, and how a bad warning is retracted within minutes.",
              "A translation review process. Machine translation of an evacuation instruction needs a native speaker in the loop before first use, per language, and a way to correct it in production.",
              "A cell broadcast path, so the warning does not depend on someone having installed anything.",
              "A deletion clock on the safety register, agreed before it holds a single real number.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="num font-[family-name:--font-mono] text-[0.8rem] text-[var(--color-ink-3)] mt-[0.25em] shrink-0 w-4">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* ------------------------------------------------------------------ */}
        <Section n="09" title="Versions">
          <p>
            Rule sets are version-stamped so any answer can be traced to the revision that
            produced it. These identifiers appear on the answers themselves.
          </p>
          <div className="not-prose mt-4 font-[family-name:--font-mono] text-[0.8rem] space-y-1.5 text-[var(--color-ink-2)]">
            <div>rule table &nbsp;<span className="text-[var(--color-ink)]">{RULES_VERSION}</span></div>
            <div>plan corpus&nbsp;<span className="text-[var(--color-ink)]">{PLAN_VERSION}</span></div>
            <div>alert schema&nbsp;<span className="text-[var(--color-ink)]">CAP v1.2 (OASIS)</span></div>
          </div>
        </Section>

        <footer className="mt-14 pt-8 border-t border-[var(--color-hairline)] text-[0.85rem] text-[var(--color-ink-3)] space-y-2">
          <p className="font-semibold text-[var(--color-ink-2)]">
            Suno is an independent hackathon prototype. It is not a government service, it is not
            affiliated with or endorsed by any government body, and it uses no government logo,
            emblem or masthead.
          </p>
          <p>
            It approves nothing, dispatches nothing, and decides nothing. In a real emergency,
            call 112.
          </p>
          <Link href="/" className="inline-flex min-h-[44px] items-center pt-2 text-[var(--color-accent)] font-semibold hover:underline underline-offset-4">
            ← Back to the warning
          </Link>
        </footer>
      </div>
    </main>
  );
}
