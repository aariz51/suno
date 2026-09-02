"use client";

// -----------------------------------------------------------------------------
// THE PLOT
// -----------------------------------------------------------------------------
// This is deliberately NOT a tile map, for three reasons that all matter here:
//
//   1. OFFLINE. Tiles are fetched over the network. A map that turns into a grey
//      grid the moment the tower drops is worse than useless in the exact
//      situation this product exists for. This renders from coordinates the app
//      already has, so it works with no network at all.
//   2. NO DEPENDENCY. No map library, no tile CDN, nothing to be blocked by a
//      proxy or an ad blocker, and no 150 KB of JavaScript on a 2G connection.
//   3. NO BOUNDARIES. This draws no national or state borders and makes no
//      territorial depiction. It plots points on a latitude/longitude grid and
//      says so. An independent prototype has no business rendering a version of
//      India's borders, and a wrong one would be a genuine problem rather than a
//      cosmetic one.
//
// The result is closer to a radar plot or a seismograph readout than to a
// consumer map, which suits the product's register.
// -----------------------------------------------------------------------------

import React, { useMemo, useState } from "react";
import { useStore } from "./store";
import { Label, cx, levelTone } from "./ui";
import { HAZARD_ICON, IconInfo } from "./icons";
import { level, type Alert } from "@/lib/data/alerts";
import { DISTRICT_BY_ID } from "@/lib/data/districts";

// India's bounding box, generous. Only used to place dots in a box.
const LNG0 = 67.5, LNG1 = 98.0;
const LAT0 = 6.5, LAT1 = 37.5;

const W = 320;
const H = 340;
// Asymmetric padding: the left gutter has to hold a right-aligned "35°N" and the
// bottom gutter a "70°E", so equal padding on all four sides clips both.
const PAD_L = 30;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 24;

function project(lat: number, lng: number) {
  const x = PAD_L + ((lng - LNG0) / (LNG1 - LNG0)) * (W - PAD_L - PAD_R);
  // Latitude increases upward; SVG y increases downward.
  const y = PAD_T + ((LAT1 - lat) / (LAT1 - LAT0)) * (H - PAD_T - PAD_B);
  return { x, y };
}

export function MapView({ alerts }: { alerts: Alert[] }) {
  const { t, districtId, setDistrictId, setTab } = useStore();
  const [hover, setHover] = useState<string | null>(null);

  const points = useMemo(
    () =>
      alerts
        .map((a) => {
          const d = DISTRICT_BY_ID[a.districtId];
          if (!d) return null;
          const p = project(d.lat, d.lng);
          return { a, d, ...p, lv: level(a) };
        })
        .filter(Boolean)
        .sort((p, q) => (p!.lv - q!.lv)) as {
          a: Alert; d: (typeof DISTRICT_BY_ID)[string]; x: number; y: number; lv: 1 | 2 | 3 | 4;
        }[],
    [alerts],
  );

  const active = hover ? points.find((p) => p.a.identifier === hover) : null;

  // Graticule every 5 degrees, drawn faintly. It gives the plot a frame of
  // reference without asserting anything about where lines on the ground are.
  const lngLines = useMemo(() => {
    const out: number[] = [];
    for (let v = 70; v <= 95; v += 5) out.push(v);
    return out;
  }, []);
  const latLines = useMemo(() => {
    const out: number[] = [];
    for (let v = 10; v <= 35; v += 5) out.push(v);
    return out;
  }, []);

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-hairline)] px-3.5 py-2.5">
        <Label>Active warnings, plotted</Label>
        <span className="num text-[11px] text-[var(--color-ink-3)]">{points.length} points</span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`${points.length} active warnings plotted by latitude and longitude`}
        >
          <defs>
            <pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.6" fill="var(--color-hairline)" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="url(#dots)" />

          {lngLines.map((v) => {
            const { x } = project(0, v);
            return (
              <g key={`lng${v}`}>
                <line x1={x} y1={PAD_T} x2={x} y2={H - PAD_B} stroke="var(--color-hairline)" strokeWidth="0.75" />
                <text x={x} y={H - PAD_B + 12} fontSize="8" textAnchor="middle" fill="var(--color-ink-3)" className="num">
                  {v}°E
                </text>
              </g>
            );
          })}
          {latLines.map((v) => {
            const { y } = project(v, 0);
            return (
              <g key={`lat${v}`}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--color-hairline)" strokeWidth="0.75" />
                <text x={PAD_L - 5} y={y + 3} fontSize="8" textAnchor="end" fill="var(--color-ink-3)" className="num">
                  {v}°N
                </text>
              </g>
            );
          })}

          {points.map((p) => {
            const tone = levelTone(p.lv);
            const r = 4 + p.lv * 1.6;
            const selected = p.d.id === districtId;
            return (
              <g
                key={p.a.identifier}
                onMouseEnter={() => setHover(p.a.identifier)}
                onMouseLeave={() => setHover(null)}
                onClick={() => { setDistrictId(p.d.id); setTab("home"); }}
                className="cursor-pointer"
                tabIndex={0}
                role="button"
                aria-label={`${p.a.headline}. ${p.d.name}, ${p.d.state}. Level ${p.lv}.`}
                onFocus={() => setHover(p.a.identifier)}
                onBlur={() => setHover(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDistrictId(p.d.id);
                    setTab("home");
                  }
                }}
              >
                {/* Invisible touch target. The visible dot encodes severity by
                    size, which puts the smallest ones well under a fingertip;
                    this keeps every point tappable at ~44px without distorting
                    the encoding. */}
                {/* Invisible hit area. The pin is drawn small so the map stays readable at
                    a district scale, but the TAP target must still clear 44 CSS px —
                    r=21 user units renders at ~46px at this viewBox scale. */}
                <circle cx={p.x} cy={p.y} r={21} fill="transparent" />
                {p.lv >= 3 && (
                  <circle cx={p.x} cy={p.y} r={r + 5} fill={`var(--color-${tone})`} opacity="0.14" pointerEvents="none" />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={`var(--color-${tone})`}
                  stroke="var(--color-paper)"
                  strokeWidth={selected ? 2.5 : 1.5}
                />
                {p.lv === 4 && (
                  <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke={`var(--color-${tone})`} strokeWidth="1.2" />
                )}
              </g>
            );
          })}
        </svg>

        {active && (
          <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper)] p-2.5 shadow-[var(--shadow-lift)] a-fade">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: `var(--color-${levelTone(active.lv)})` }}
              />
              <span className="truncate text-[13px] font-bold">{active.a.headline}</span>
            </div>
            <div className="num mt-0.5 text-[11px] text-[var(--color-ink-3)]">
              {active.d.name}, {active.d.state} · L{active.lv}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-hairline)] px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {([4, 3, 2, 1] as const).map((lv) => (
            <span key={lv} className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-ink-3)]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: `var(--color-${levelTone(lv)})` }}
              />
              L{lv} {t[`band${lv}` as "band1"]}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-ink-3)]">
          Schematic plot by latitude and longitude. Not a survey map. No national or state
          boundaries are depicted, and none should be inferred. Renders with no network.
        </p>
      </div>
    </div>
  );
}
