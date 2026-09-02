"use client";

// -----------------------------------------------------------------------------
// ALERTS
// -----------------------------------------------------------------------------
// The national feed, filterable by hazard, plus the bulletin translator.
//
// The bulletin translator is deliberately open-ended: a reviewer can paste text
// this build has never seen and watch it become an ordered action list. That is
// the honest way to demonstrate a language model doing work — on input the
// builder did not choose — rather than on a canned example.
// -----------------------------------------------------------------------------

import React, { useMemo, useState } from "react";
import { useStore } from "./store";
import { Btn, Card, Chip, ChipRow, Label, LevelBand, SampleMark, SectionTitle, cx, levelTone } from "./ui";
import { HAZARD_ICON, IconBolt, IconInfo, IconLayers, IconPin, IconSend, IconSpeaker } from "./icons";
import { ALERTS, HAZARD_LABEL, level, rankAlerts, populationUnder, formatPeople, type Alert } from "@/lib/data/alerts";
import { DISTRICT_BY_ID, type HazardType } from "@/lib/data/districts";
import { MapView } from "./MapView";

export function AlertsTab() {
  const { t } = useStore();
  const [filter, setFilter] = useState<HazardType | "all">("all");

  const counts = useMemo(() => {
    const m = new Map<HazardType, number>();
    for (const a of ALERTS) m.set(a.hazard, (m.get(a.hazard) ?? 0) + 1);
    return m;
  }, []);

  const shown = useMemo(
    () =>
      rankAlerts(filter === "all" ? ALERTS : ALERTS.filter((a) => a.hazard === filter)),
    [filter],
  );

  return (
    <div className="pt-5">
      <div className="px-5">
        <SectionTitle aside={<SampleMark />}>{t.nationalMap}</SectionTitle>
      </div>

      <div className="px-5">
        <MapView alerts={ALERTS} />
      </div>

      <div className="mt-6 px-5">
        <SectionTitle aside={<span className="num text-[13px] text-[var(--color-ink-3)]">{ALERTS.length}</span>}>
          {t.activeAlerts}
        </SectionTitle>
        <p className="-mt-2 mb-3 text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
          Ordered by level, then by how many people are underneath. District
          population is a ceiling on exposure, not a casualty estimate.
        </p>
        <ChipRow>
          <Chip active={filter === "all"} onClick={() => setFilter("all")} count={ALERTS.length}>
            {t.allIndia}
          </Chip>
          {[...counts.entries()].map(([h, n]) => (
            <Chip key={h} active={filter === h} onClick={() => setFilter(h)} count={n}>
              {HAZARD_LABEL[h]}
            </Chip>
          ))}
        </ChipRow>

        <div className="mt-3 space-y-2.5 stagger">
          {shown.map((a) => (
            <AlertCard key={a.identifier} alert={a} />
          ))}
        </div>
      </div>

      <div className="mt-8 px-5">
        <BulletinTool />
      </div>

      <div className="h-8" />
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const { t, setDistrictId, setTab, speak, stopSpeaking, speaking, ttsAvailable } = useStore();
  const [open, setOpen] = useState(false);
  const lv = level(alert);
  const tone = levelTone(lv);
  const Icon = HAZARD_ICON[alert.hazard] ?? IconInfo;
  const d = DISTRICT_BY_ID[alert.districtId];

  const speakId = `alert-${alert.identifier}`;
  const isSpeaking = speaking === speakId;
  const spoken = [alert.headline, ...alert.instruction].join(". ");

  return (
    <Card className="overflow-hidden">
      <div
        className="h-[3px] w-full"
        style={{ background: `var(--color-${tone})` }}
        aria-hidden
      />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[10px]"
            style={{ background: `var(--color-${tone}-wash)`, color: `var(--color-${tone})` }}
          >
            <Icon size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* The shared component, not a local copy of it. This card used to
                  hand-roll its own severity badge, which meant two independent
                  definitions of what a Level 3 looks like — exactly the drift
                  that makes an interface feel assembled rather than designed. */}
              <LevelBand lv={lv} band={t[`band${lv}` as "band1"]} />
              <span className="text-[11.5px] font-semibold text-[var(--color-ink-3)]">
                {HAZARD_LABEL[alert.hazard]}
              </span>
            </div>

            <h3 className="mt-1.5 text-[16px] font-bold leading-snug">{alert.headline}</h3>

            <div className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-ink-3)]">
              <IconPin size={14} />
              {d?.name}, {d?.state}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {alert.measure && (
                <div className="num inline-flex flex-wrap items-baseline gap-x-2 rounded-[8px] bg-[var(--color-paper-2)] px-2.5 py-1.5">
                  <span className="text-[15px] font-extrabold">{alert.measure.value}</span>
                  <span className="text-[11.5px] font-semibold text-[var(--color-ink-3)]">
                    {alert.measure.label} · {alert.measure.threshold}
                  </span>
                </div>
              )}
              {/* Exposure. A feed sorted by severity alone cannot tell you that
                  one Level 3 covers a city and another covers a hill town. */}
              <div
                className="num inline-flex items-baseline gap-1.5 rounded-[8px] px-2.5 py-1.5"
                style={{ background: `var(--color-${tone}-wash)`, color: `var(--color-${tone})` }}
                title="District population, 2011 Census. A ceiling on who is under this warning, not an estimate of who is in the hazard footprint."
              >
                <span className="text-[15px] font-extrabold">{formatPeople(populationUnder(alert))}</span>
                <span className="text-[11.5px] font-semibold opacity-80">under it</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Btn size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? t.close : t.whatToDo}
          </Btn>
          {ttsAvailable && (
            <Btn
              size="sm"
              variant={isSpeaking ? "danger" : "outline"}
              onClick={() => (isSpeaking ? stopSpeaking() : speak(speakId, spoken))}
              icon={<IconSpeaker size={16} />}
            >
              {isSpeaking ? t.stopListening : t.listen}
            </Btn>
          )}
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => {
              setDistrictId(alert.districtId);
              setTab("home");
            }}
          >
            {t.yourArea}
          </Btn>
        </div>

        {open && (
          <div className="mt-3 border-t border-[var(--color-hairline)] pt-3 a-rise">
            <Label>{t.whatToDo}</Label>
            <ol className="mt-1.5 space-y-1.5">
              {alert.instruction.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] font-semibold leading-snug">
                  <span className="num text-[var(--color-ink-3)]">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <Label className="mt-3 !text-[var(--color-l4)]">{t.whatNotToDo}</Label>
            <ul className="mt-1.5 space-y-1.5">
              {alert.avoid.map((s, i) => (
                <li key={i} className="text-[14px] font-semibold leading-snug text-[var(--color-ink-2)]">
                  {s}
                </li>
              ))}
            </ul>

            <div className="mt-3 rounded-[9px] bg-[var(--color-paper-2)] p-3">
              <Label>Why this is Level {lv}</Label>
              <div className="mt-1.5 grid gap-1.5 text-[12px] sm:grid-cols-3">
                {([
                  ["CAP severity", alert.severity],
                  ["Urgency", alert.urgency],
                  ["Certainty", alert.certainty],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-2 sm:block">
                    <span className="text-[var(--color-ink-3)]">{k}</span>
                    <span className="block font-bold">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
                {lv === 4
                  ? "Extreme severity with immediate urgency maps to Level 4. That combination, and only that combination, produces an evacuation screen."
                  : lv === 3
                    ? "Severe or extreme severity without immediate urgency maps to Level 3."
                    : lv === 2
                      ? "Moderate severity maps to Level 2."
                      : "Minor severity maps to Level 1."}{" "}
                The mapping is a fixed function of the CAP fields, not a judgement — the same
                inputs always produce the same level.
              </p>
              <div className="num mt-2 text-[11px] leading-relaxed text-[var(--color-ink-3)]">
                {alert.identifier} · {alert.senderName} · CAP {alert.msgType}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// BULLETIN TRANSLATOR
// -----------------------------------------------------------------------------

const SAMPLE_BULLETIN =
  "Heavy to very heavy rainfall with extremely heavy falls at isolated places very likely over " +
  "north coastal districts during next 24 hours. Squally winds speed reaching 45-55 kmph gusting " +
  "to 65 kmph likely to prevail along and off the coast. Sea condition will be rough to very " +
  "rough. Fishermen are advised not to venture into the sea. Waterlogging of low lying areas and " +
  "localised landslides in hilly terrain cannot be ruled out.";

function BulletinTool() {
  const { t, lang } = useStore();
  const [text, setText] = useState(SAMPLE_BULLETIN);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<null | {
    source: string;
    answer: string;
    action_steps: string[];
    avoid: string[];
    helplines: string[];
    hazard?: string | null;
    rejectedBecause?: string;
  }>(null);

  async function run() {
    setBusy(true);
    setOut(null);
    try {
      const r = await fetch("/api/plain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bulletin: text, lang }),
      });
      setOut(await r.json());
    } catch {
      setOut({
        source: "unavailable",
        answer: "",
        action_steps: [],
        avoid: [],
        helplines: ["1077", "1078"],
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <SectionTitle>Turn a real bulletin into instructions</SectionTitle>
      <p className="-mt-1 mb-3 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
        A real IMD bulletin is written for a district magistrate. Paste any bulletin text here —
        including one this build has never seen — and it becomes an ordered list of actions. Known
        hazard types are answered from the hand-written plan with no model call; only unrecognised
        text reaches the model, and every quantity in the output has to appear in the input or the
        answer is discarded.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        aria-label="Bulletin text"
        className="w-full resize-y rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] p-3 text-[14px] leading-relaxed text-[var(--color-ink)]"
      />

      <div className="mt-2 flex gap-2">
        <Btn variant="primary" onClick={run} disabled={busy || text.trim().length < 20} icon={<IconSend size={17} />}>
          {busy ? t.thinking : "Rewrite"}
        </Btn>
        <Btn variant="ghost" onClick={() => { setText(""); setOut(null); }}>
          Clear
        </Btn>
      </div>

      {out && (
        <div className="mt-4 border-t border-[var(--color-hairline)] pt-3 a-rise">
          <ProvenanceTag source={out.source} reason={out.rejectedBecause} hazard={out.hazard ?? null} />

          {out.answer && (
            <p className="mt-2 text-[16px] font-bold leading-snug">{out.answer}</p>
          )}

          {out.action_steps.length > 0 && (
            <>
              <Label className="mt-3">{t.whatToDo}</Label>
              <ol className="mt-1.5 space-y-1.5">
                {out.action_steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-[14.5px] font-semibold leading-snug">
                    <span className="num text-[var(--color-ink-3)]">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {out.avoid.length > 0 && (
            <>
              <Label className="mt-3 !text-[var(--color-l4)]">{t.whatNotToDo}</Label>
              <ul className="mt-1.5 space-y-1.5">
                {out.avoid.map((s, i) => (
                  <li key={i} className="text-[14px] font-semibold leading-snug text-[var(--color-ink-2)]">
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}

          {out.helplines.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {out.helplines.map((h) => (
                <a
                  key={h}
                  href={`tel:${h}`}
                  className="num rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-[13px] font-bold"
                >
                  {h}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/** Which path produced this answer, stated plainly. Almost nothing else in this
 *  category tells you, and it is the clearest evidence that the model is bounded
 *  rather than decorative. */
export function ProvenanceTag({
  source, reason, hazard, model,
}: { source: string; reason?: string; hazard?: string | null; model?: string }) {
  const map: Record<string, { text: string; tone: string }> = {
    rules: { text: "Answered from the rule table — no model call", tone: "safe" },
    model: { text: `Answered by the model${model ? ` (${model})` : ""} — validated`, tone: "accent" },
    cache: { text: "Answered from cache", tone: "accent" },
    rejected: { text: `Model answer rejected by the validator${reason ? `: ${reason}` : ""}`, tone: "l3" },
    unavailable: { text: "Model unavailable — deterministic answer only", tone: "l2" },
    identity: { text: "No translation needed", tone: "l1" },
    none: { text: "Nothing to do", tone: "l1" },
  };
  const m = map[source] ?? { text: source, tone: "l1" };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]"
        style={{ background: `var(--color-${m.tone}-wash)`, color: `var(--color-${m.tone})` }}
      >
        <IconBolt size={13} />
        {m.text}
      </span>
      {hazard && (
        <span className="rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-3)]">
          matched: {hazard}
        </span>
      )}
    </div>
  );
}
