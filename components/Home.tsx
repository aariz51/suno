"use client";

// -----------------------------------------------------------------------------
// HOME
// -----------------------------------------------------------------------------
// One screen, three states, driven entirely by the highest active alert level
// for the selected district.
//
// The design decision that matters here: at Level 4 the page does not show a red
// card on a white page. The ground itself turns, the header shrinks, the
// countdown is the largest thing on the screen, and the ordered instructions sit
// above everything else including the location picker. A red card can be
// scrolled past. A red page cannot.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "./store";
import { useTranslate, sourceLabel, useMounted } from "./useTranslate";
import { Btn, Card, Chip, ChipRow, Hairline, Label, LevelBand, SampleMark, SectionTitle, Sheet, cx, levelTone } from "./ui";
import {
  HAZARD_ICON, IconChevron, IconClock, IconInfo, IconMic, IconPin, IconRoute,
  IconShelter, IconSpeaker, IconSpeakerOff,
} from "./icons";
import { DISTRICTS, DISTRICT_BY_ID, nearestDistrict } from "@/lib/data/districts";
import { LEVEL_META, level, type Alert } from "@/lib/data/alerts";
import { sheltersFor } from "@/lib/data/shelters";
import { LANG_BY_CODE, LANGS, COVERED_BEYOND_UPSTREAM_M } from "@/lib/i18n";
import { UPSTREAM_LANGUAGES as UPSTREAM } from "@/lib/data/alerts";

export function Home({ onAsk }: { onAsk: () => void }) {
  const { phase } = useStore();
  return (
    // On a phone this is one column in reading order: the warning, then the
    // argument, then where you are. On a wide screen the warning keeps a
    // readable measure in the main column and the two supporting cards move
    // into a side column, so the extra width buys context rather than longer
    // lines. Nothing is hidden at either size; only the arrangement changes.
    <div className="px-5 pt-5 lg:px-0 lg:pt-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-10">
        <div className="lg:max-w-[680px] 2xl:max-w-[820px]">
          {phase === "act" ? <ActState onAsk={onAsk} /> : phase === "watch" ? <WatchState /> : <CalmState />}
        </div>

        <aside className="mt-6 space-y-6 lg:sticky lg:top-[104px] lg:mt-0">
          <LanguageGap />
          <DistrictPicker />
        </aside>
      </div>
      <div className="h-8" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// LEVEL 4
// -----------------------------------------------------------------------------

function ActState({ onAsk }: { onAsk: () => void }) {
  const { t, top, districtId, lang } = useStore();
  const [allShelters, setAllShelters] = useState(false);
  const district = DISTRICT_BY_ID[districtId];
  if (!top) return <CalmState />;

  const lv = level(top);
  const shelters = sheltersFor(districtId);

  return (
    <div className="stagger">
      <div>
        <LevelBand lv={lv} band={t[`band${lv}` as "band4"]} />
      </div>

      <TranslatedHeadline alert={top} />

      <Countdown alert={top} />

      <Instructions alert={top} />

      {top.measure && (
        <Card className="mt-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <Label>{t.measured}</Label>
            <SampleMark />
          </div>
          <div dir="ltr" className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 rtl:flex-row-reverse rtl:justify-end">
            <span className="num text-[26px] font-extrabold leading-none">{top.measure.value}</span>
            <span className="text-[14px] font-semibold text-[var(--color-ink-2)]">
              {top.measure.label}
            </span>
          </div>
          <div className="num mt-1.5 text-[13px] text-[var(--color-ink-3)]">
            {top.measure.threshold}
            {top.measure.trend ? ` · ${top.measure.trend}` : ""}
          </div>
        </Card>
      )}

      {top.shelters && shelters.length > 0 && (
        <div className="mt-5">
          <SectionTitle aside={<SampleMark />}>{t.shelters}</SectionTitle>
          <div className="space-y-2">
            {shelters.slice(0, 2).map((s) => (
              <ShelterRow key={s.id} id={s.id} />
            ))}
          </div>
          {shelters.length > 2 && (
            <Btn
              full
              className="mt-2"
              variant="outline"
              onClick={() => setAllShelters(true)}
              icon={<IconShelter size={19} />}
            >
              {t.findShelter} ({shelters.length})
            </Btn>
          )}
        </div>
      )}

      <Card className="mt-5 border-[var(--color-accent)]/30 bg-[var(--color-accent-wash)] p-4">
        <div className="flex items-start gap-3">
          <IconMic size={22} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
          <div className="min-w-0">
            <div className="text-[15px] font-bold">{t.askTitle}</div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{t.askSub}</p>
            <Btn className="mt-3" variant="primary" size="sm" onClick={onAsk}>
              {t.ask}
            </Btn>
          </div>
        </div>
      </Card>

      <IssuedBy alert={top} />

      <ShelterSheet open={allShelters} onClose={() => setAllShelters(false)} />
    </div>
  );
}

/** Every shelter for the district, with the facts that decide whether the walk
 *  is worth making: distance, whether there is space left, and whether it takes
 *  livestock — the single most common reason a farming household refuses to
 *  evacuate at all. */
function ShelterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, districtId } = useStore();
  const shelters = sheltersFor(districtId);
  const total = shelters.reduce((n, s) => n + s.capacity, 0);
  const free = total - shelters.reduce((n, s) => n + s.occupied, 0);
  const district = DISTRICT_BY_ID[districtId];

  return (
    <Sheet open={open} onClose={onClose} title={t.shelters}>
      <div className="mb-3 flex items-start justify-between gap-3 rounded-[11px] bg-[var(--color-paper-2)] p-3.5">
        <div>
          <Label>Capacity in this district</Label>
          <div className="num mt-0.5 text-[20px] font-extrabold">
            {free.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} places free
          </div>
          <div className="num mt-0.5 text-[12px] text-[var(--color-ink-3)]">
            District population {district ? district.pop.toLocaleString("en-IN") : "—"}
          </div>
        </div>
        <SampleMark />
      </div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
        That ratio is the real constraint, and it is why &ldquo;go to a shelter&rdquo; cannot be the
        whole of a plan. The arithmetic is worked through on the How this would actually run page.
      </p>
      <div className="space-y-2">
        {shelters.map((s) => <ShelterRow key={s.id} id={s.id} />)}
      </div>
      <div className="mt-4">
        <Btn full variant="ghost" onClick={onClose}>{t.close}</Btn>
      </div>
    </Sheet>
  );
}

/** The headline and description, translated at request time and labelled with
 *  where the translation came from. */
function TranslatedHeadline({ alert }: { alert: Alert }) {
  const { t, lang, districtId } = useStore();
  const district = DISTRICT_BY_ID[districtId];
  const src = useMemo(() => [alert.headline], [alert.headline]);
  const { lines, source } = useTranslate(src, lang);
  const label = sourceLabel(source, t);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-l4)]">
        <IconPin size={16} />
        {district?.name}, {district?.state}
      </div>
      <h1 className="mt-1.5 text-[30px] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[38px]">
        {lines[0] ?? alert.headline}
      </h1>
      {label && source !== "original" && (
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
          {label}
        </div>
      )}
    </div>
  );
}

/** Live countdown. Tabular figures so it does not jitter, and it says what it
 *  is counting to rather than just showing a number. */
function Countdown({ alert }: { alert: Alert }) {
  const { t } = useStore();
  const mounted = useMounted();
  // The onset is an offset from load, so the target instant only exists once we
  // are in the browser. Computing it during the server render would produce a
  // different number than the client's and throw the whole tree away.
  const [target, setTarget] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (alert.onsetOffsetMin === null) { setTarget(null); return; }
    const tgt = Date.now() + alert.onsetOffsetMin * 60_000;
    setTarget(tgt);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [alert.onsetOffsetMin]);

  if (!mounted) {
    return (
      <Card className="mt-4 border-[var(--color-l4)]/25 bg-[var(--color-l4-wash)] p-4">
        <Label className="!text-[var(--color-l4)]">{t.timeToImpact}</Label>
        <div className="shimmer mt-2 h-11 w-40 rounded-[8px] bg-[var(--color-l4)]/10" />
      </Card>
    );
  }

  if (target === null) {
    return (
      <Card className="mt-4 border-[var(--color-l4)]/25 bg-[var(--color-l4-wash)] p-4">
        <Label className="!text-[var(--color-l4)]">{t.timeToImpact}</Label>
        <div className="mt-1 text-[24px] font-extrabold text-[var(--color-l4)]">{t.started}</div>
      </Card>
    );
  }

  const left = Math.max(0, target - now);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const sec = Math.floor((left % 60_000) / 1000);

  return (
    <Card className="mt-4 border-[var(--color-l4)]/25 bg-[var(--color-l4-wash)] p-4">
      <div className="flex items-center gap-2">
        <IconClock size={17} className="text-[var(--color-l4)]" />
        <Label className="!text-[var(--color-l4)]">{t.timeToImpact}</Label>
      </div>
      {/* Forced LTR. A clock readout is a number, not prose: in an RTL page the
          bidi algorithm reorders "1 hr 49 min 05" so the seconds land at the
          wrong end and the whole thing reads as a different time. Urdu, Arabic
          and Hebrew interfaces all set numeric readouts LTR for this reason. */}
      <div
        dir="ltr"
        className="num mt-1 flex items-baseline gap-1 text-[var(--color-l4)] rtl:justify-end"
        aria-live="off"
      >
        {h > 0 && (
          <>
            <span className="text-[46px] font-extrabold leading-none tracking-[-0.03em]">{h}</span>
            <span className="mr-2 text-[16px] font-bold">{t.hours}</span>
          </>
        )}
        <span className="text-[46px] font-extrabold leading-none tracking-[-0.03em]">
          {String(m).padStart(2, "0")}
        </span>
        <span className="mr-2 text-[16px] font-bold">{t.mins}</span>
        <span className="text-[22px] font-bold opacity-60">{String(sec).padStart(2, "0")}</span>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-snug text-[var(--color-ink-2)]">
        {t.useTheTime}
      </p>
    </Card>
  );
}

/** The ordered actions, and the separate list of things that kill people. The
 *  order is never generated and never reordered — see lib/rules.ts. */
function Instructions({ alert }: { alert: Alert }) {
  const { t, lang, speak, stopSpeaking, speaking, ttsAvailable } = useStore();

  const src = useMemo(
    () => [...alert.instruction, ...alert.avoid],
    [alert.instruction, alert.avoid],
  );
  const { lines, source } = useTranslate(src, lang);
  const doLines = lines.slice(0, alert.instruction.length);
  const avoidLines = lines.slice(alert.instruction.length);

  const speakId = `instr-${alert.identifier}`;
  const isSpeaking = speaking === speakId;
  const spoken = [alert.headline, ...doLines, t.whatNotToDo, ...avoidLines].join(". ");

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-[-0.01em]">{t.whatToDo}</h2>
        {ttsAvailable && (
          <Btn
            size="sm"
            variant={isSpeaking ? "danger" : "outline"}
            onClick={() => (isSpeaking ? stopSpeaking() : speak(speakId, spoken))}
            icon={isSpeaking ? <IconSpeakerOff size={17} /> : <IconSpeaker size={17} />}
          >
            {isSpeaking ? t.stopListening : t.listen}
          </Btn>
        )}
      </div>

      <ol className="space-y-2">
        {doLines.map((line, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-[11px] border border-[var(--color-hairline)] bg-[var(--color-paper)] p-3.5"
          >
            <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-ink)] text-[13px] font-extrabold text-[var(--color-paper)]">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[16px] font-semibold leading-snug">{line}</span>
          </li>
        ))}
      </ol>

      {avoidLines.length > 0 && (
        <>
          <h2 className="mb-2 mt-5 text-[17px] font-bold tracking-[-0.01em] text-[var(--color-l4)]">
            {t.whatNotToDo}
          </h2>
          <ul className="space-y-2">
            {avoidLines.map((line, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-[11px] border border-[var(--color-l4)]/25 bg-[var(--color-l4-wash)] p-3.5"
              >
                <span
                  aria-hidden
                  className="mt-[7px] h-[3px] w-4 shrink-0 rounded-full bg-[var(--color-l4)]"
                />
                <span className="text-[15px] font-semibold leading-snug text-[var(--color-ink)]">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {source !== "original" && sourceLabel(source, t) && (
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
          {sourceLabel(source, t)}
        </div>
      )}
    </div>
  );
}

/** Provenance, always. A warning with no attributable source is a rumour. */
function IssuedBy({ alert }: { alert: Alert }) {
  const { t } = useStore();
  const mounted = useMounted();
  const sent = mounted ? new Date(Date.now() + alert.sentOffsetMin * 60_000) : null;
  return (
    <div className="mt-6 rounded-[11px] border border-dashed border-[var(--color-hairline)] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label>{t.issuedBy}</Label>
          <div className="mt-0.5 truncate text-[13px] font-bold">{alert.senderName}</div>
          <div className="num mt-0.5 text-[11.5px] text-[var(--color-ink-3)]">
            {alert.identifier} · CAP {alert.msgType} · {alert.severity}/{alert.urgency}/{alert.certainty} ·{" "}
            {sent ? sent.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"}
          </div>
        </div>
        <SampleMark />
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
        {t.capNote}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LEVEL 2 / 3
// -----------------------------------------------------------------------------

function WatchState() {
  const { t, top, districtId, lang, setTab } = useStore();
  const district = DISTRICT_BY_ID[districtId];
  if (!top) return <CalmState />;
  const lv = level(top);
  const tone = levelTone(lv);
  const Icon = HAZARD_ICON[top.hazard] ?? IconInfo;

  return (
    <div className="stagger">
      <LevelBand lv={lv} band={t[`band${lv}` as "band2"]} />
      <div className="mt-3 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: `var(--color-${tone})` }}>
        <IconPin size={16} />
        {district?.name}, {district?.state}
      </div>
      <h1 className="mt-1.5 text-[26px] font-extrabold leading-[1.12] tracking-[-0.02em] sm:text-[32px]">
        {top.headline}
      </h1>

      <Countdown alert={top} />
      <Instructions alert={top} />
      <IssuedBy alert={top} />

      <Btn full className="mt-5" variant="outline" onClick={() => setTab("plan")} icon={<IconChevron size={18} />}>
        {t.plans}
      </Btn>
    </div>
  );
}

// -----------------------------------------------------------------------------
// CALM
// -----------------------------------------------------------------------------

function CalmState() {
  const { t, districtId, alerts } = useStore();
  const district = DISTRICT_BY_ID[districtId];

  return (
    <div className="stagger">
      <Card className="border-[var(--color-safe)]/25 bg-[var(--color-safe-wash)] p-5">
        <div className="flex items-start gap-3.5">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-safe)] text-white">
            <IconShelter size={21} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
              {t.allClear}
            </h1>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              {t.allClearSub}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-safe)]">
              <IconPin size={15} />
              {district?.name}, {district?.state}
            </div>
          </div>
        </div>
      </Card>

      {alerts.length > 0 && (
        <div className="mt-6">
          <SectionTitle aside={<SampleMark />}>{t.activeAlerts}</SectionTitle>
          <div className="space-y-2">
            {alerts.map((a) => <MiniAlert key={a.identifier} alert={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniAlert({ alert }: { alert: Alert }) {
  const { t } = useStore();
  const lv = level(alert);
  const tone = levelTone(lv);
  const Icon = HAZARD_ICON[alert.hazard] ?? IconInfo;
  const mins = Math.abs(alert.sentOffsetMin);
  const agoTxt = mins < 60 ? `${mins} ${t.mins}` : `${Math.round(mins / 60)} ${t.hours}`;

  return (
    <Card className="p-3.5">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[9px]"
          style={{ background: `var(--color-${tone}-wash)`, color: `var(--color-${tone})` }}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: `var(--color-${tone})` }}
            >
              L{lv} · {t[`band${lv}` as "band1"]}
            </span>
            <span className="num text-[11px] text-[var(--color-ink-3)]">
              {t.updated} {agoTxt} {t.ago}
            </span>
          </div>
          <div className="mt-0.5 text-[15px] font-bold leading-snug">{alert.headline}</div>
          {alert.measure && (
            <div className="num mt-1 text-[12px] text-[var(--color-ink-3)]">
              {alert.measure.label}: {alert.measure.value} ({alert.measure.threshold})
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// THE ARGUMENT, ON THE HOME SCREEN
// -----------------------------------------------------------------------------

/** The argument, on the first screen, as a broken promise rather than a wish.
 *
 *  This is the strongest form the problem statement takes. CAP v1.2 — the OASIS
 *  standard that Sachet, IMD and CWC already publish in — gives every alert a
 *  REPEATING <info> block, each carrying its own <language> element. Carrying an
 *  alert in many languages is not an enhancement anyone has to be talked into;
 *  it is a slot the format was designed with, and the bulletins fill two of them.
 *
 *  So the gap is not "nobody thought of this". It is a designed-in capability
 *  left unused, which is a far more answerable thing to put in front of a
 *  reviewer than a complaint about coverage. */
function LanguageGap() {
  const { t, districtId, lang, setLang } = useStore();
  const district = DISTRICT_BY_ID[districtId];
  if (!district) return null;

  const meta = LANG_BY_CODE[district.lang];
  const covered = (UPSTREAM as readonly string[]).includes(district.lang);

  return (
    <Card className="overflow-hidden">
      <div
        className="px-4 pt-4"
        style={{
          background: covered ? "var(--color-safe-wash)" : "var(--color-l3-wash)",
        }}
      >
        <Label className={covered ? "!text-[var(--color-safe)]" : "!text-[var(--color-l3)]"}>
          {t.gapTitle}
        </Label>
        <p className="mt-1.5 text-[19px] font-extrabold leading-[1.2] tracking-[-0.015em]">
          {t.gapSlot.replace("{n}", String(LANGS.length))}
          <br />
          {t.gapFills.replace("{m}", String(UPSTREAM.length))}
        </p>
        <p className="mt-2 pb-4 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
          {t.gapBody}
        </p>
      </div>

      {/* The block diagram. Two filled, eleven empty — the whole argument in one
          glance, and it needs no translation to read. */}
      <div className="border-t border-[var(--color-hairline)] px-4 py-3.5">
        <div className="flex flex-wrap gap-1.5" aria-hidden>
          {LANGS.map((l) => {
            const filled = (UPSTREAM as readonly string[]).includes(l.code);
            return (
              <span
                key={l.code}
                title={`${l.english}: ${filled ? "in the bulletin" : "empty"}`}
                className="flex h-7 min-w-[34px] items-center justify-center rounded-[5px] px-1.5 text-[10px] font-extrabold uppercase"
                style={
                  filled
                    ? { background: "var(--color-ink)", color: "var(--color-paper)" }
                    : {
                        border: "1px dashed var(--color-ink-3)",
                        color: "var(--color-ink-3)",
                      }
                }
              >
                {l.code}
              </span>
            );
          })}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
          {t.gapLegend.replace("{k}", String(LANGS.length - UPSTREAM.length))}
        </p>
      </div>

      {/* And the same fact for the district actually on screen. */}
      <div className="border-t border-[var(--color-hairline)] px-4 py-3.5">
        <p className="text-[14.5px] font-bold leading-snug">
          {t.districtShare
            .replace("{p}", String(district.langShare))
            .replace("{s}", district.state)
            .replace("{l}", meta?.native ?? "")}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
          {covered
            ? t.districtCovered
            : t.districtNotCovered.replace("{l}", meta?.native ?? "")}
        </p>
        {lang !== district.lang && (
          <Btn size="sm" variant="outline" className="mt-3" onClick={() => setLang(district.lang)}>
            {t.readThisIn.replace("{n}", meta?.native ?? "")}
          </Btn>
        )}
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------------

function DistrictPicker() {
  const { t, districtId, setDistrictId } = useStore();
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof DISTRICTS>();
    for (const d of DISTRICTS) {
      const arr = m.get(d.state) ?? [];
      arr.push(d);
      m.set(d.state, arr);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  function locate() {
    if (!("geolocation" in navigator)) {
      setErr(t.locationDenied);
      return;
    }
    setLocating(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = nearestDistrict(pos.coords.latitude, pos.coords.longitude);
        setDistrictId(d.id);
        setLocating(false);
      },
      () => {
        setErr(t.locationDenied);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  return (
    <Card className="p-4">
      <SectionTitle>{t.yourArea}</SectionTitle>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          aria-label={t.changeArea}
          className="min-h-[44px] w-full rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper)] px-3 text-[15px] font-semibold text-[var(--color-ink)]"
        >
          {grouped.map(([state, ds]) => (
            <optgroup key={state} label={state}>
              {ds.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Btn onClick={locate} disabled={locating} icon={<IconPin size={18} />} className="shrink-0">
          {locating ? t.locating : t.useMyLocation}
        </Btn>
      </div>
      {err && <p className="mt-2 text-[13px] font-semibold text-[var(--color-l3)]">{err}</p>}
      <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--color-ink-3)]">
        {t.districtNote}
      </p>
    </Card>
  );
}

// -----------------------------------------------------------------------------

export function ShelterRow({ id }: { id: string }) {
  const { t, districtId } = useStore();
  const s = sheltersFor(districtId).find((x) => x.id === id);
  if (!s) return null;

  const free = s.capacity - s.occupied;
  const ratio = s.occupied / s.capacity;
  const status = free <= 0 ? t.full : ratio > 0.85 ? t.nearlyFull : `${free} ${t.spaceLeft}`;
  const statusTone = free <= 0 ? "l4" : ratio > 0.85 ? "l2" : "safe";

  const facs = [
    s.facilities.women && t.facWomen,
    s.facilities.accessible && t.facAccessible,
    s.facilities.medical && t.facMedical,
    s.facilities.livestock && t.facLivestock,
    s.facilities.power && t.facPower,
    s.facilities.water && t.facWater,
  ].filter(Boolean) as string[];

  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-snug">{s.name}</div>
          <div className="num mt-0.5 text-[12.5px] text-[var(--color-ink-3)]">
            {s.km} km · {s.kind} · {t.askFor} {s.contact.role}
          </div>
        </div>
        <span
          className="num shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{ background: `var(--color-${statusTone}-wash)`, color: `var(--color-${statusTone})` }}
        >
          {status}
        </span>
      </div>

      {facs.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {facs.map((f) => (
            <span
              key={f}
              className="rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-2)]"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          data-tap
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[9px] border border-[var(--color-hairline)] text-[14px] font-bold hover:border-[var(--color-ink-3)]"
        >
          <IconRoute size={17} />
          {t.directions}
        </a>
        <a
          href={`tel:${s.contact.phone}`}
          data-tap
          className="num inline-flex min-h-[44px] items-center justify-center rounded-[9px] border border-[var(--color-hairline)] px-4 text-[14px] font-bold hover:border-[var(--color-ink-3)]"
        >
          {s.contact.phone}
        </a>
      </div>
    </Card>
  );
}
