"use client";

// -----------------------------------------------------------------------------
// FIRST RUN
// -----------------------------------------------------------------------------
// Modelled on the reference build's onboarding, which gets one thing exactly
// right: this product looks completely different depending on whether a disaster
// is active, and a reviewer who lands on a calm screen will never know the other
// two states exist. So it asks up front.
//
// Two deliberate differences from the reference:
//
//   1. The reference asks you to pick a "portal state", which is a mode switch —
//      it can put the app into Calm while the district it is showing has a live
//      Level 4 warning. Here each option is a REAL DISTRICT whose own data
//      produces that state. Nothing is simulated, and the card says so.
//
//   2. Location is offered first, not buried. If a person allows it they skip
//      the chooser entirely and land on their own district, which is the actual
//      product. The chooser is the fallback for reviewers and for anyone who
//      declines — and declining is a normal, respected outcome, not a dead end.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useStore } from "./store";
import { Btn, cx } from "./ui";
import { IconChevron, IconPin, IconShield } from "./icons";
import { DISTRICT_BY_ID, nearestDistrict } from "@/lib/data/districts";
import { LANG_BY_CODE, LANGS } from "@/lib/i18n";

const SEEN_KEY = "suno.onboarded";

/** Each option names a district that genuinely produces that phase from its own
 *  alert data. Changing an alert changes what these lead to, which is correct:
 *  the chooser must never be able to promise a state the data cannot deliver. */
const OPTIONS = [
  { phase: "calm" as const, district: "new-delhi", tone: "safe", badgeKey: "defaultLabel" as const, bodyKey: "startCalm" as const },
  { phase: "watch" as const, district: "wayanad", tone: "l2", badgeKey: null, bodyKey: "startWatch" as const },
  { phase: "act" as const, district: "golaghat", tone: "l4", badgeKey: "emergency" as const, bodyKey: "startAct" as const },
];

export function Onboarding() {
  const { t, setDistrictId, setLang, lang } = useStore();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch { /* private window */ }
    if (!seen) setOpen(true);
  }, []);

  function done() {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* fine */ }
    setOpen(false);
  }

  function choose(districtId: string) {
    setDistrictId(districtId);
    done();
  }

  function useLocation() {
    if (!("geolocation" in navigator)) { setDenied(true); return; }
    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = nearestDistrict(pos.coords.latitude, pos.coords.longitude);
        setDistrictId(d.id);
        setLocating(false);
        done();
      },
      () => { setLocating(false); setDenied(true); },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300_000 },
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <div className="absolute inset-0 bg-[rgb(10_13_18/0.5)] backdrop-blur-[3px] a-fade" aria-hidden />

      <div
        className={cx(
          "relative w-full max-w-[480px] a-sheet",
          "max-h-[92vh] overflow-y-auto overscroll-contain",
          "rounded-t-[20px] sm:rounded-[18px] sm:mx-4",
          "border border-[var(--color-hairline)] bg-[var(--color-paper)]",
          "shadow-[var(--shadow-lift)] p-5 sm:p-6",
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-wash)] px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--color-accent)]">
          <IconShield size={13} />
          {t.prototypeNotice}
        </span>

        {/* The language control belongs HERE, before anything else, and every
            option is written in its own script. A person who cannot read the
            welcome screen cannot use a language menu buried behind it — which
            is the same failure this whole product exists to fix, so getting it
            wrong on our own first screen would be indefensible. */}
        <div className="no-bar -mx-5 mt-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <div className="flex w-max gap-1.5 pb-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                lang={l.code}
                dir={l.dir}
                aria-pressed={l.code === lang}
                className={cx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors",
                  l.code === lang
                    ? "border-transparent bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "border-[var(--color-hairline)] text-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]",
                )}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>

        <h1
          id="onboard-title"
          className="mt-3 text-[26px] font-extrabold leading-[1.12] tracking-[-0.025em]"
        >
          {t.chooseStart}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
          {t.chooseStartSub}
        </p>

        {/* Location first. It is the real product; the chooser is the fallback. */}
        <button
          onClick={useLocation}
          disabled={locating}
          className={cx(
            "mt-4 flex w-full items-center gap-3 rounded-[12px] border border-[var(--color-accent)]/35",
            "bg-[var(--color-accent-wash)] px-4 py-3.5 text-start",
            "transition-colors disabled:opacity-60",
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-white">
            <IconPin size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">
              {locating ? t.locating : t.useMyLocationInstead}
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[var(--color-ink-2)]">
              Matched to the nearest district on your device. Your coordinates are never sent
              anywhere.
            </span>
          </span>
          <IconChevron size={18} className="shrink-0 text-[var(--color-accent)] rtl:rotate-180" />
        </button>

        {denied && (
          <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-[var(--color-l3)]">
            {t.locationDenied}
          </p>
        )}

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--color-hairline)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-3)]">
            or
          </span>
          <span className="h-px flex-1 bg-[var(--color-hairline)]" />
        </div>

        <div className="space-y-2.5">
          {OPTIONS.map((o) => {
            const d = DISTRICT_BY_ID[o.district];
            const meta = d ? LANG_BY_CODE[d.lang] : null;
            return (
              <button
                key={o.phase}
                onClick={() => choose(o.district)}
                className={cx(
                  "flex w-full items-start gap-3 rounded-[12px] border px-4 py-3.5 text-start",
                  "transition-colors",
                )}
                style={{
                  borderColor: `color-mix(in oklab, var(--color-${o.tone}) 30%, transparent)`,
                  background: `var(--color-${o.tone}-wash)`,
                }}
              >
                <span
                  className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: `var(--color-${o.tone})` }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-extrabold">{t[o.phase]}</span>
                    {o.badgeKey && (
                      <span
                        className="rounded-[5px] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.07em] text-white"
                        style={{ background: `var(--color-${o.tone})` }}
                      >
                        {t[o.badgeKey]}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-ink-2)]">
                    {t[o.bodyKey]}
                  </span>
                  {d && (
                    <span className="mt-1 block text-[11.5px] font-semibold text-[var(--color-ink-2)]">
                      {d.name}, {d.state}
                      {meta && lang !== d.lang ? ` · opens in ${meta.english}` : ""}
                    </span>
                  )}
                </span>
                <IconChevron
                  size={18}
                  className="mt-[3px] shrink-0 rtl:rotate-180"
                  style={{ color: `var(--color-${o.tone})` }}
                />
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
          {t.notGovt} {t.syntheticNotice} You can change district, and language, at any time from
          the home screen.
        </p>

        <Btn full variant="ghost" className="mt-3" onClick={() => choose("golaghat")}>
          {t.close}
        </Btn>
      </div>
    </div>
  );
}
