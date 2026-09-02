"use client";

// -----------------------------------------------------------------------------
// THE PIPELINE VIEW
// -----------------------------------------------------------------------------
// Everything a citizen sees on /app is the last hundred metres of a system. This
// page is the rest of it: what would be ingested, what an independent check
// would say about it, and what actually carries the result to a person.
//
// It is deliberately NOT part of the citizen journey — the brief says reviewers
// test the citizen experience, not an admin panel, so this sits on its own route
// and the app never routes into it. It exists to answer the end-to-end question:
// "does the solution address the backend, infrastructure and processes."
//
// The CAP reader on this page is real. Paste genuine CAP XML and it parses.
// The risk scan and the delivery fan-out are simulations of real designs, and
// each says so in its own words rather than in a footnote.
// -----------------------------------------------------------------------------

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { parseCap, toCap, hazardFromEvent, CAP_PARSER_LIMITS, type ParsedCap } from "@/lib/cap";
import { compareWithOfficial, disagreementSummary, scanAll, RISK_WEIGHTS } from "@/lib/risk";
import { CHANNELS, fanout, estimatedUnionReach } from "@/lib/delivery";
import { ALERTS, formatPeople, level, populationUnder, rankAlerts } from "@/lib/data/alerts";
import { LANGS } from "@/lib/i18n";
import { DISTRICTS } from "@/lib/data/districts";

const TONE: Record<number, string> = { 1: "l1", 2: "l2", 3: "l3", 4: "l4" };

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-paper)] p-5 ${className}`}>
      {children}
    </div>
  );
}

function Label({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <div
      className="text-[10.5px] font-extrabold uppercase tracking-[0.09em]"
      style={{ color: tone ? `var(--color-${tone})` : "var(--color-ink-3)" }}
    >
      {children}
    </div>
  );
}

/** Marks a block as modelled rather than connected. Used without exception. */
function Sim({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[10px] border border-dashed border-[var(--color-l2)]/40 bg-[var(--color-l2-wash)] p-3">
      <Label tone="l2">Simulated — nothing is connected</Label>
      <p className="mt-1.5 text-[12.5px] leading-[1.6] text-[var(--color-ink-2)]">{children}</p>
    </div>
  );
}

const SAMPLE_CAP = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CWC-GHY.2026.0417</identifier>
  <sender>cwc.brahmaputra@synthetic.invalid</sender>
  <sent>2026-08-29T09:12:00+05:30</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>en-IN</language>
    <category>Met</category>
    <event>Severe Flood</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <senderName>Central Water Commission - Brahmaputra Division</senderName>
    <headline>Dhansiri above danger mark - leave low ground now</headline>
    <description>River Dhansiri at Numaligarh gauge reading 79.42 m against a
      danger level of 78.60 m, rising at 11 cm/hr. Inundation of low-lying
      revenue villages expected within 2 hours.</description>
    <instruction>Leave for higher ground now.
Take drinking water, daily medicines and ID papers in a sealed bag.
Switch off the main electricity switch before you leave.
Do not walk or drive through moving water.</instruction>
    <area>
      <areaDesc>Golaghat district, Assam - Dhansiri left bank</areaDesc>
      <geocode><valueName>district</valueName><value>golaghat</value></geocode>
    </area>
  </info>
</alert>`;

export function Pipeline() {
  const [xml, setXml] = useState(SAMPLE_CAP);
  const parsed: ParsedCap = useMemo(() => parseCap(xml), [xml]);
  const hazard = parsed.info ? hazardFromEvent(parsed.info.event, parsed.info.description) : null;

  const disagreements = useMemo(() => compareWithOfficial(), []);
  const summary = useMemo(() => disagreementSummary(), []);
  const scan = useMemo(() => scanAll().slice(0, 6), []);

  const [alertIdx, setAlertIdx] = useState(0);
  const [cbAuthorised, setCbAuthorised] = useState(false);
  const ranked = useMemo(() => rankAlerts(ALERTS), []);
  const chosen = ranked[alertIdx] ?? ranked[0];
  const fan = useMemo(() => fanout(chosen, { cellBroadcastAuthorised: cbAuthorised }), [chosen, cbAuthorised]);
  const union = estimatedUnionReach(chosen, { cellBroadcastAuthorised: cbAuthorised });

  const multiCap = useMemo(
    () =>
      toCap(chosen, [
        { language: "en-IN", headline: chosen.headline, description: chosen.description, instruction: chosen.instruction },
        { language: "as-IN", headline: "ধনশিৰি বিপদ চিহ্নৰ ওপৰত", description: "…", instruction: ["এতিয়াই উচ্চ ভূমিলৈ যাওক।"] },
        { language: "hi-IN", headline: "धनसिरी खतरे के निशान से ऊपर", description: "…", instruction: ["अभी ऊँची जगह पर जाएँ।"] },
      ], "2026-08-29T09:12:00+05:30"),
    [chosen],
  );

  return (
    <main className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10 lg:py-16">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-[var(--color-accent)] hover:underline"
        >
          <span aria-hidden>←</span> Back
        </Link>

        <header className="mt-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-ink-3)]">
            Suno · the machinery behind the warning
          </p>
          <h1 className="mt-3 max-w-[22ch] text-[36px] font-extrabold leading-[1.06] tracking-[-0.032em] lg:text-[52px]">
            What the citizen screen is the last hundred metres of.
          </h1>
          <p className="mt-5 max-w-[70ch] text-[15.5px] leading-[1.65] text-[var(--color-ink-2)]">
            The app is one end of a pipeline. This page is the rest of it: the feed that would be
            ingested, an independent check that disagrees with it out loud, and the channels that
            decide whether a warning ever reaches a person. The CAP reader below is real code and
            runs on whatever you paste into it. The scan and the delivery model are simulations of
            real designs, and each says so.
          </p>
          <p className="mt-4 max-w-[70ch] text-[13px] leading-[1.6] text-[var(--color-ink-3)]">
            Nothing on this page connects to a government system. That is a rule of the brief, not a
            shortcut: live ingestion of Sachet would need an agreement with NDMA, and cell broadcast
            needs an authority designated under the Disaster Management Act 2005. What is shown is
            the shape those integrations would take.
          </p>
        </header>

        {/* ---------- 01 INGEST ---------------------------------------- */}
        <section className="mt-14 border-t border-[var(--color-hairline)] pt-10">
          <div className="flex items-baseline gap-3">
            <span className="num text-[12px] font-bold text-[var(--color-ink-3)]">01</span>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] lg:text-[30px]">Ingest — CAP v1.2</h2>
          </div>
          <p className="mt-3 max-w-[72ch] text-[14.5px] leading-[1.65] text-[var(--color-ink-2)]">
            Sachet, IMD, CWC and INCOIS already publish in CAP v1.2. Everywhere else on this site we
            claim that swapping our synthetic feed for a live one is a parser change rather than a
            redesign. This is the parser. Edit the XML and watch the warning screen&apos;s fields
            change — including the count of <code className="num">&lt;info&gt;</code> blocks, which
            is the number this entire product is about.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <Label>Paste CAP XML</Label>
              <textarea
                value={xml}
                onChange={(e) => setXml(e.target.value)}
                rows={18}
                spellCheck={false}
                aria-label="CAP XML input"
                className="num mt-2 w-full resize-y rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] p-3 text-[11.5px] leading-[1.55] text-[var(--color-ink)]"
              />
              <button
                onClick={() => setXml(SAMPLE_CAP)}
                className="mt-2 min-h-[40px] rounded-[9px] border border-[var(--color-hairline)] px-3 text-[13px] font-bold"
              >
                Reset to sample
              </button>
            </div>

            <div>
              <Label>Parsed</Label>
              <Card className="mt-2">
                {parsed.info ? (
                  <>
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-white"
                      style={{
                        background: `var(--color-${
                          TONE[
                            parsed.info.severity === "Extreme" && parsed.info.urgency === "Immediate"
                              ? 4
                              : parsed.info.severity === "Extreme" || parsed.info.severity === "Severe"
                                ? 3
                                : parsed.info.severity === "Moderate"
                                  ? 2
                                  : 1
                          ]
                        })`,
                      }}
                    >
                      Level{" "}
                      {parsed.info.severity === "Extreme" && parsed.info.urgency === "Immediate"
                        ? 4
                        : parsed.info.severity === "Extreme" || parsed.info.severity === "Severe"
                          ? 3
                          : parsed.info.severity === "Moderate"
                            ? 2
                            : 1}
                    </div>
                    <h3 className="mt-3 text-[19px] font-extrabold leading-tight">{parsed.info.headline}</h3>
                    <dl className="num mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                      {([
                        ["identifier", parsed.identifier],
                        ["event", parsed.info.event],
                        ["severity", parsed.info.severity],
                        ["urgency", parsed.info.urgency],
                        ["certainty", parsed.info.certainty],
                        ["area", parsed.info.areaDesc],
                        ["hazard matched", hazard ?? "no match"],
                        ["district geocode", parsed.info.geocodes.district ?? "—"],
                      ] as [string, string][]).map(([k, v]) => (
                        <React.Fragment key={k}>
                          <dt className="text-[var(--color-ink-3)]">{k}</dt>
                          <dd className="truncate font-semibold">{v || "—"}</dd>
                        </React.Fragment>
                      ))}
                    </dl>

                    {parsed.info.instruction.length > 0 && (
                      <>
                        <Label>Instructions extracted</Label>
                        <ol className="mt-1.5 space-y-1">
                          {parsed.info.instruction.map((x, i) => (
                            <li key={i} className="flex gap-2 text-[13px] leading-snug">
                              <span className="num text-[var(--color-ink-3)]">{i + 1}.</span>
                              {x}
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] font-semibold text-[var(--color-l3)]">
                    No <code className="num">&lt;info&gt;</code> block found — nothing deliverable.
                  </p>
                )}
              </Card>

              <Card
                className="mt-3"
                >
                <Label tone={parsed.infoBlockCount <= 1 ? "l3" : "safe"}>
                  Language blocks in this alert
                </Label>
                <div className="num mt-1 text-[30px] font-extrabold leading-none">
                  {parsed.infoBlockCount}
                  <span className="text-[15px] font-bold text-[var(--color-ink-3)]"> / {LANGS.length} possible</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--color-ink-2)]">
                  {parsed.infoBlockCount <= 1
                    ? "One block means one language. The format allows one per language and the sender filled a single slot — which is the entire problem this product exists to solve."
                    : `Languages present: ${parsed.languagesPresent.join(", ")}.`}
                </p>
              </Card>

              {parsed.warnings.length > 0 && (
                <Card className="mt-3">
                  <Label tone="l2">Parser notes</Label>
                  <ul className="mt-1.5 space-y-1 text-[12.5px] leading-[1.55] text-[var(--color-ink-2)]">
                    {parsed.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          <details className="mt-5 rounded-[12px] border border-[var(--color-hairline)] p-4">
            <summary className="cursor-pointer text-[14px] font-bold">
              What this reader does not do
            </summary>
            <ul className="mt-3 space-y-2 text-[13px] leading-[1.6] text-[var(--color-ink-2)]">
              {CAP_PARSER_LIMITS.map((l, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="mt-[9px] h-[3px] w-3 shrink-0 rounded-full bg-[var(--color-l2)]" />
                  {l}
                </li>
              ))}
            </ul>
          </details>

          <details className="mt-3 rounded-[12px] border border-[var(--color-hairline)] p-4">
            <summary className="cursor-pointer text-[14px] font-bold">
              The same alert, emitted with three language blocks
            </summary>
            <p className="mt-2 text-[13px] leading-[1.6] text-[var(--color-ink-2)]">
              The other direction. This is what a filled CAP document looks like — the format needs
              no extension to carry thirteen languages, only a sender who fills the blocks.
            </p>
            <pre className="num mt-3 overflow-x-auto rounded-[10px] bg-[var(--color-paper-2)] p-3 text-[11px] leading-[1.5]">
              {multiCap}
            </pre>
          </details>
        </section>

        {/* ---------- 02 SCAN ------------------------------------------- */}
        <section className="mt-14 border-t border-[var(--color-hairline)] pt-10">
          <div className="flex items-baseline gap-3">
            <span className="num text-[12px] font-bold text-[var(--color-ink-3)]">02</span>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] lg:text-[30px]">
              An independent scan, and where it disagrees
            </h2>
          </div>
          <p className="mt-3 max-w-[72ch] text-[14.5px] leading-[1.65] text-[var(--color-ink-2)]">
            Running our own risk surface alongside the official feed is only useful if we publish the
            disagreement. A system that silently overrides an official alert has appointed itself the
            authority; one that silently suppresses its own signal has thrown away its only
            independent check. The official level is always what the citizen screen shows — this is
            an instrument for a district officer, not an override.
          </p>

          <Sim>
            The weather driving this scan is generated deterministically per district. In production
            the inputs would be Open-Meteo — free, no key, all {DISTRICTS.length}+ districts in a
            handful of bulk calls — together with CWC gauge readings and the GSI landslide
            thresholds. What is real here is the shape: plain arithmetic with published weights, no
            model anywhere near it, and every score showing its inputs.
          </Sim>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {([
              ["Agree", summary.agree, "safe"],
              ["Scan reads higher", summary.scanHigher, "l3"],
              ["Agency reads higher", summary.officialHigher, "l2"],
              ["Scan only, no alert", summary.scanOnly, "l1"],
            ] as [string, number, string][]).map(([k, v, tone]) => (
              <Card key={k}>
                <Label tone={tone}>{k}</Label>
                <div className="num mt-1 text-[26px] font-extrabold leading-none">{v}</div>
              </Card>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {disagreements
              .filter((d) => d.verdict !== "agree")
              .slice(0, 5)
              .map((d) => (
                <Card key={d.district.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-bold">
                      {d.district.name}, {d.district.state}
                    </span>
                    <span className="num text-[12.5px] text-[var(--color-ink-3)]">
                      official {d.officialLevel ?? "—"} · scan {d.scanLevel} · score {d.scanScore}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--color-ink-2)]">{d.note}</p>
                </Card>
              ))}
          </div>

          <details className="mt-4 rounded-[12px] border border-[var(--color-hairline)] p-4">
            <summary className="cursor-pointer text-[14px] font-bold">
              The weights, and one district worked through
            </summary>
            <div className="num mt-3 flex flex-wrap gap-2 text-[12px]">
              {Object.entries(RISK_WEIGHTS).map(([k, v]) => (
                <span key={k} className="rounded-[7px] bg-[var(--color-paper-2)] px-2.5 py-1">
                  {k} <strong>{v}</strong>
                </span>
              ))}
            </div>
            {scan[0] && (
              <div className="mt-4">
                <div className="text-[14px] font-bold">
                  {scan[0].district.name} — score {scan[0].score}, level {scan[0].level}
                </div>
                <table className="num mt-2 w-full text-left text-[12.5px]">
                  <tbody>
                    {scan[0].factors.map((f) => (
                      <tr key={f.label} className="border-t border-[var(--color-hairline)]">
                        <td className="py-1.5 text-[var(--color-ink-3)]">{f.label}</td>
                        <td className="py-1.5">{f.value}</td>
                        <td className="py-1.5 text-end font-bold">+{f.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        </section>

        {/* ---------- 03 DELIVER ---------------------------------------- */}
        <section className="mt-14 border-t border-[var(--color-hairline)] pt-10">
          <div className="flex items-baseline gap-3">
            <span className="num text-[12px] font-bold text-[var(--color-ink-3)]">03</span>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] lg:text-[30px]">
              Deliver — a generated warning is not a delivered one
            </h2>
          </div>
          <p className="mt-3 max-w-[72ch] text-[14.5px] leading-[1.65] text-[var(--color-ink-2)]">
            Choose a live warning and see what each bearer would and would not achieve. The channel
            characteristics are real; the transmission is not.
          </p>

          <Sim>
            Nothing is transmitted. There is no SMS gateway, no bot token, and no cell-broadcast
            entity, because those need operator agreements and — for cell broadcast — an authority
            designated under the DM Act 2005. Reach is derived from the district population already
            in our dataset; latencies are the published orders of magnitude for each bearer.
          </Sim>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <select
              value={alertIdx}
              onChange={(e) => setAlertIdx(Number(e.target.value))}
              aria-label="Choose a warning"
              className="min-h-[44px] rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper)] px-3 text-[14px] font-semibold"
            >
              {ranked.map((a, i) => (
                <option key={a.identifier} value={i}>
                  L{level(a)} · {a.headline.slice(0, 46)}
                </option>
              ))}
            </select>
            <button
              type="button"
              role="switch"
              aria-checked={cbAuthorised}
              onClick={() => setCbAuthorised((v) => !v)}
              className="flex min-h-[44px] items-center gap-2.5 rounded-[10px] border border-[var(--color-hairline)] px-3 text-[13.5px] font-semibold"
            >
              <span
                aria-hidden
                className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border-2 text-[12px] font-black text-white"
                style={{
                  borderColor: cbAuthorised ? "var(--color-safe)" : "var(--color-ink-3)",
                  background: cbAuthorised ? "var(--color-safe)" : "transparent",
                }}
              >
                {cbAuthorised ? "✓" : ""}
              </span>
              Cell broadcast authorised
            </button>
          </div>

          <Card className="mt-4">
            <Label>Optimistic union reach</Label>
            <div className="num mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-[34px] font-extrabold leading-none">{formatPeople(union)}</span>
              <span className="text-[14px] font-semibold text-[var(--color-ink-3)]">
                of {formatPeople(populationUnder(chosen))} under this warning
              </span>
            </div>
            <p className="mt-2 max-w-[70ch] text-[12.5px] leading-[1.6] text-[var(--color-ink-3)]">
              The union across channels is not the sum — the same person is on several. This assumes
              the channels are independent, which overstates reach, so treat it as an optimistic
              bound. Untick cell broadcast and watch it collapse: that single permission is worth
              more than every other channel put together.
            </p>
          </Card>

          <div className="mt-4 space-y-2">
            {fan.map((f) => (
              <Card key={f.channel.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[15px] font-bold">{f.channel.name}</span>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.07em]"
                    style={{
                      background: `var(--color-${f.status === "delivered" ? "safe" : f.status === "degraded" ? "l2" : "l4"}-wash)`,
                      color: `var(--color-${f.status === "delivered" ? "safe" : f.status === "degraded" ? "l2" : "l4"})`,
                    }}
                  >
                    {f.status}
                  </span>
                </div>
                <div className="num mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--color-ink-3)]">
                  <span>
                    <strong className="text-[var(--color-ink)]">{formatPeople(f.reached)}</strong> reached
                  </span>
                  <span>
                    {f.channel.latencySec < 60
                      ? `${f.channel.latencySec}s`
                      : `${Math.round(f.channel.latencySec / 60)} min`}{" "}
                    latency
                  </span>
                  <span>{f.channel.needsSubscriberList ? "needs a list" : "no list needed"}</span>
                  <span>{f.channel.featurePhone ? "works on a feature phone" : "smartphone only"}</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--color-ink-2)]">{f.channel.note}</p>
                <p className="mt-1.5 text-[11.5px] text-[var(--color-ink-3)]">
                  Operated by {f.channel.operatedBy}. {f.detail}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------- close --------------------------------------------- */}
        <section className="mt-14 border-t border-[var(--color-hairline)] pt-10">
          <p className="max-w-[72ch] text-[14.5px] leading-[1.7] text-[var(--color-ink-2)]">
            None of the three stages above is the hard part. The CAP reader is a hundred lines, the
            scan is arithmetic, and the fan-out is a table. The hard part is the row that says
            &ldquo;operated by telecom operators on instruction from NDMA&rdquo; — a permission, not
            a program. This page exists to be honest about which of the two we are short of.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="inline-flex min-h-[52px] items-center rounded-[12px] bg-[var(--color-ink)] px-6 text-[16px] font-bold text-[var(--color-paper)]"
            >
              Open the warning portal
            </Link>
            <Link
              href="/how-it-runs"
              className="inline-flex min-h-[52px] items-center rounded-[12px] border border-[var(--color-hairline)] px-6 text-[15px] font-bold"
            >
              How this would actually run
            </Link>
          </div>
          <p className="mt-8 text-[11.5px] leading-[1.7] text-[var(--color-ink-3)]">
            The population ranking, the independent scan and the per-channel delivery truth on this
            page are adapted from BhimShila (github.com/CyNoGeN1109/bhimshila), which is the best
            work in this space and does all three against live feeds. Ours are simulations, because
            the brief requires simulated integrations — the ideas are theirs and are credited here
            and in the source.
          </p>
        </section>
      </div>
    </main>
  );
}
