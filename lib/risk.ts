// -----------------------------------------------------------------------------
// THE INDEPENDENT SCAN, AND THE DISAGREEMENT
// -----------------------------------------------------------------------------
// Adapted from BhimShila (github.com/CyNoGeN1109/bhimshila), which runs its own
// risk surface across all 724 districts alongside the official Sachet feed and
// then — this is the good part — reports where the two disagree instead of
// quietly preferring one.
//
// That is worth copying because of what it refuses to do. A system that silently
// overrides an official alert has appointed itself the authority. A system that
// silently suppresses its own signal has thrown away the only independent check
// it had. Publishing the disagreement is the only honest third option, and it is
// the one a government partner could actually live with: the official alert
// stays authoritative on screen, and the disagreement is raised as a question
// for a human rather than resolved by software.
//
// PROTOTYPE HONESTY: the weather driving this scan is SYNTHETIC, generated
// deterministically per district. In production the inputs would be Open-Meteo
// (free, no key, 724 districts in a handful of bulk calls), CWC gauge readings
// and the GSI landslide thresholds. What is real here is the SHAPE: the scan is
// plain arithmetic with readable weights, it never consults a model, and it
// always shows its inputs. Swapping synthetic weather for a live pull changes
// one function, not the design.
// -----------------------------------------------------------------------------

import { DISTRICTS, type District, type HazardType } from "./data/districts";
import { ALERTS, level, type Alert, type Level } from "./data/alerts";

/** Deterministic pseudo-random in [0,1) from a string. Same district, same day,
 *  same number — so the scan is reproducible and a screenshot can be trusted. */
function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export interface RiskFactor {
  label: string;
  value: string;
  /** Contribution to the score, so no number on screen is unexplained. */
  weight: number;
}

export interface DistrictRisk {
  district: District;
  hazard: HazardType;
  /** 0–100. Plain arithmetic, never a model output. */
  score: number;
  level: Level;
  factors: RiskFactor[];
}

/** The weights, in one place, readable. If a score is ever disputed this is the
 *  document that answers it. */
export const RISK_WEIGHTS = {
  rainfall: 34,
  soilSaturation: 22,
  hazardSeasonality: 18,
  terrain: 14,
  populationDensity: 12,
} as const;

function scoreToLevel(score: number): Level {
  if (score >= 78) return 4;
  if (score >= 58) return 3;
  if (score >= 36) return 2;
  return 1;
}

/** The synthetic stand-in for an Open-Meteo pull. One function, and it is the
 *  only thing that would change to go live. */
function syntheticWeather(d: District) {
  const r = seeded(`${d.id}:rain`);
  const s = seeded(`${d.id}:soil`);
  return {
    rain72h: Math.round(r * 240), // mm
    soilSaturationPct: Math.round(40 + s * 60),
  };
}

const TERRAIN_RISK: Partial<Record<HazardType, number>> = {
  landslide: 1.0,
  flood: 0.82,
  "urban-flood": 0.7,
  cyclone: 0.78,
  earthquake: 0.55,
  heatwave: 0.45,
  thunderstorm: 0.4,
  drought: 0.35,
  wildfire: 0.5,
  coldwave: 0.35,
};

export function scanDistrict(d: District): DistrictRisk {
  const hazard = d.hazards[0] ?? "flood";
  const w = syntheticWeather(d);

  const rainN = Math.min(1, w.rain72h / 200);
  const soilN = Math.min(1, w.soilSaturationPct / 100);
  const seasonN = seeded(`${d.id}:season`);
  const terrainN = TERRAIN_RISK[hazard] ?? 0.5;
  const densityN = Math.min(1, d.pop / 8_000_000);

  const factors: RiskFactor[] = [
    { label: "Rainfall, 72 hours", value: `${w.rain72h} mm`, weight: Math.round(rainN * RISK_WEIGHTS.rainfall) },
    { label: "Soil saturation", value: `${w.soilSaturationPct}%`, weight: Math.round(soilN * RISK_WEIGHTS.soilSaturation) },
    { label: "Hazard seasonality", value: `${Math.round(seasonN * 100)}%`, weight: Math.round(seasonN * RISK_WEIGHTS.hazardSeasonality) },
    { label: "Terrain exposure", value: hazard, weight: Math.round(terrainN * RISK_WEIGHTS.terrain) },
    { label: "Population density", value: d.pop.toLocaleString("en-IN"), weight: Math.round(densityN * RISK_WEIGHTS.populationDensity) },
  ];

  const score = Math.min(100, factors.reduce((n, f) => n + f.weight, 0));
  return { district: d, hazard, score, level: scoreToLevel(score), factors };
}

export function scanAll(): DistrictRisk[] {
  return DISTRICTS.map(scanDistrict).sort((a, b) => b.score - a.score);
}

// -----------------------------------------------------------------------------

export type Verdict = "agree" | "scan-higher" | "official-higher" | "scan-only";

export interface Disagreement {
  district: District;
  officialLevel: Level | null;
  officialAlert: Alert | null;
  scanLevel: Level;
  scanScore: number;
  verdict: Verdict;
  note: string;
}

/** Compare our scan with the official feed, district by district.
 *
 *  The official alert is ALWAYS what the citizen screen shows. This comparison
 *  is an operator's instrument, not an override, and the wording below is
 *  written to keep it that way. */
export function compareWithOfficial(): Disagreement[] {
  const byDistrict = new Map<string, Alert>();
  for (const a of ALERTS) {
    const prev = byDistrict.get(a.districtId);
    if (!prev || level(a) > level(prev)) byDistrict.set(a.districtId, a);
  }

  return scanAll()
    .map((r): Disagreement => {
      const official = byDistrict.get(r.district.id) ?? null;
      const officialLevel = official ? level(official) : null;

      let verdict: Verdict;
      let note: string;

      if (officialLevel === null) {
        verdict = r.level >= 3 ? "scan-only" : "agree";
        note =
          r.level >= 3
            ? "Our scan reads elevated risk here and no official warning is in force. This is a question for the district office, not a warning — nothing is shown to citizens on the strength of it."
            : "No official warning, and our scan agrees there is nothing to raise.";
      } else if (r.level === officialLevel) {
        verdict = "agree";
        note = "Our independent scan reaches the same level as the issuing agency.";
      } else if (r.level > officialLevel) {
        verdict = "scan-higher";
        note =
          "Our scan reads higher than the official warning. The official level is what citizens see; this disagreement is surfaced for a human to resolve, never used to escalate automatically.";
      } else {
        verdict = "official-higher";
        note =
          "The issuing agency reads higher than our scan. They have gauges, radar and staff on the ground that we do not. Their level stands, and the gap tells us where our model is weak.";
      }

      return {
        district: r.district,
        officialLevel,
        officialAlert: official,
        scanLevel: r.level,
        scanScore: r.score,
        verdict,
        note,
      };
    })
    .sort((a, b) => {
      const rank = (v: Verdict) => ({ "scan-higher": 0, "official-higher": 1, "scan-only": 2, agree: 3 })[v];
      const d = rank(a.verdict) - rank(b.verdict);
      return d !== 0 ? d : b.scanScore - a.scanScore;
    });
}

export function disagreementSummary() {
  const all = compareWithOfficial();
  return {
    total: all.length,
    agree: all.filter((d) => d.verdict === "agree").length,
    scanHigher: all.filter((d) => d.verdict === "scan-higher").length,
    officialHigher: all.filter((d) => d.verdict === "official-higher").length,
    scanOnly: all.filter((d) => d.verdict === "scan-only").length,
  };
}
