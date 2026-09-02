"use client";

// -----------------------------------------------------------------------------
// PLAN — what to do before, during and after.
// -----------------------------------------------------------------------------
// Two decisions worth naming, because both are departures from how the current
// public guidance is presented:
//
//   1. AFTER exists. Most preparedness pages stop at "during". A large share of
//      preventable harm in floods and earthquakes happens in the 48 hours
//      afterwards — contaminated water, live wiring, aftershocks, re-ignition.
//      Omitting it is not brevity, it is a gap.
//
//   2. DO NOT is a separate, visually distinct block, not a bullet mixed into a
//      list. The "do not" items are the ones that actually kill people: driving
//      through water, using a lift, going outside during the eye of a cyclone.
//      A person scanning under stress reads the red block first, which is
//      exactly the right reading order.
//
// The hazard shown defaults to the one actually warned for in the selected
// district, so a person in Puri lands on Cyclone rather than on an alphabetical
// list starting at Earthquake.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { Card, Chip, ChipRow, Label, SectionTitle, Hairline, cx } from "./ui";
import { PLANS, PLAN_VERSION, type Plan } from "@/lib/data/plans";
import { useTranslate, sourceLabel } from "./useTranslate";
import type { HazardType } from "@/lib/data/districts";

const HAZARD_LABEL: Record<string, string> = {
  flood: "Flood", cyclone: "Cyclone", earthquake: "Earthquake",
  heatwave: "Heatwave", landslide: "Landslide", wildfire: "Wildfire",
};

/** A block of instruction lines. `tone` drives the only colour on the screen. */
function Block({
  title, lines, tone, ordered,
}: { title: string; lines: string[]; tone: "ink" | "l4" | "safe"; ordered?: boolean }) {
  if (!lines.length) return null;
  const dot =
    tone === "l4" ? "bg-[var(--color-l4)]"
    : tone === "safe" ? "bg-[var(--color-safe)]"
    : "bg-[var(--color-ink-3)]";
  return (
    <div>
      <Label className={cx(tone === "l4" && "text-[var(--color-l4)]")}>{title}</Label>
      <ul className="mt-2 space-y-2">
        {lines.map((l, i) => (
          <li key={l} className="flex gap-2.5 text-[14px] leading-[1.55]">
            {ordered ? (
              <span className="num mt-[1px] w-4 shrink-0 text-[12px] font-bold text-[var(--color-ink-3)]">
                {i + 1}
              </span>
            ) : (
              <span className={cx("mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
            )}
            <span className={cx(tone === "l4" ? "text-[var(--color-ink)]" : "text-[var(--color-ink-2)]")}>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlanTab() {
  const { t, districtId, alerts, lang } = useStore();

  // Default to the hazard this district is actually being warned about.
  const warned = alerts[0]?.hazard as HazardType | undefined;
  const initial =
    (warned && PLANS.some((p) => p.hazard === warned) ? warned : PLANS[0].hazard) as HazardType;

  const [hazard, setHazard] = useState<HazardType>(initial);
  useEffect(() => { setHazard(initial); }, [districtId, initial]);

  const plan: Plan = PLANS.find((p) => p.hazard === hazard) ?? PLANS[0];

  // The plan corpus is written in English. In any other language it is
  // translated, structurally verified, and labelled — never silently swapped.
  const all = [plan.premise, ...plan.kit, ...plan.during, ...plan.avoid, ...plan.after];
  const { lines: L, source } = useTranslate(all, lang);

  let i = 0;
  const premise = L[i++];
  const kit = L.slice(i, (i += plan.kit.length));
  const during = L.slice(i, (i += plan.during.length));
  const avoid = L.slice(i, (i += plan.avoid.length));
  const after = L.slice(i, (i += plan.after.length));

  return (
    <div className="px-4 pb-28 pt-4 md:px-6">
      <SectionTitle
        aside={
          <span className="num text-[11px] text-[var(--color-ink-3)]">{PLAN_VERSION}</span>
        }
      >
        {t.plans}
      </SectionTitle>

      <p className="mb-3 text-[13px] text-[var(--color-ink-3)]">{t.choosePlan}</p>

      <ChipRow>
        {PLANS.map((p) => (
          <Chip
            key={p.hazard}
            active={p.hazard === hazard}
            onClick={() => setHazard(p.hazard as HazardType)}
          >
            {HAZARD_LABEL[p.hazard] ?? p.hazard}
            {p.hazard === warned && (
              <span
                className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-l3)]"
                title="Active warning for your area"
              />
            )}
          </Chip>
        ))}
      </ChipRow>

      <Card className="mt-4 p-5">
        <h3 className="text-[19px] font-bold leading-tight tracking-[-0.015em]">
          {HAZARD_LABEL[plan.hazard] ?? plan.hazard}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.6] text-[var(--color-ink-2)]">{premise}</p>

        {sourceLabel(source, t) && (
          <div
            className={cx(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
              "text-[10px] font-bold uppercase tracking-[0.07em]",
              source === "model" || source === "cache"
                ? "bg-[var(--color-accent-wash)] text-[var(--color-accent-ink)]"
                : "border border-dashed border-[var(--color-ink-3)] text-[var(--color-ink-3)]",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {sourceLabel(source, t)}
          </div>
        )}

        <Hairline className="my-5" />
        <Block title={t.essentialKit} lines={kit} tone="ink" />

        <Hairline className="my-5" />
        <Block title={t.whatToDo} lines={during} tone="ink" ordered />

        <Hairline className="my-5" />
        <div className="-mx-2 rounded-[10px] bg-[var(--color-l4-wash)] px-3 py-3">
          <Block title={t.whatNotToDo} lines={avoid} tone="l4" />
        </div>

        <Hairline className="my-5" />
        <Block title={t.afterwards} lines={after} tone="safe" />
      </Card>

      {/* The specific document, not a gesture at a body of guidance. A reader
          who wants to check a line against its source needs the title. */}
      <div className="mt-4 rounded-[11px] border border-dashed border-[var(--color-hairline)] p-3.5">
        <Label>Derived from</Label>
        <p className="mt-1 text-[12.5px] font-semibold leading-snug text-[var(--color-ink-2)]">
          {plan.source.title}
        </p>
        <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-3)]">{plan.source.publisher}</p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
          Rewritten for reading level, not quoted. Version-stamped{" "}
          <span className="num font-semibold">{PLAN_VERSION}</span>, so any answer built from it can
          be traced to the revision that produced it. This is a prototype and is not official
          guidance.
        </p>
      </div>
    </div>
  );
}

export default PlanTab;
