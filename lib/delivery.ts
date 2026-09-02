// -----------------------------------------------------------------------------
// DELIVERY
// -----------------------------------------------------------------------------
// A warning that has been generated has not been delivered. BhimShila makes this
// point well by reporting per-channel delivery truth rather than a single "sent"
// — you learn which channel actually carried it and which silently did not.
//
// The channels below are real, and so are their characteristics. Cell broadcast
// genuinely does reach every handset in a cell in seconds without a subscriber
// list; SMS genuinely is slow at district scale and needs one; a feature phone
// genuinely cannot render any of this and needs an IVR call. Those constraints
// are the reason the product is shaped the way it is, and they are worth showing
// rather than asserting.
//
// PROTOTYPE HONESTY: nothing here transmits anything. No SMS gateway, no
// Telegram bot token, no cell-broadcast entity — those require operator
// agreements and, for cell broadcast, an authority designated under the DM Act.
// This models the fan-out and shows what each channel would and would not
// achieve. Reach figures are derived from the district population already in
// our dataset; latencies are the published orders of magnitude for each bearer.
// -----------------------------------------------------------------------------

import { DISTRICT_BY_ID, type District } from "./data/districts";
import { type Alert, populationUnder } from "./data/alerts";

export type ChannelId = "cell-broadcast" | "sms" | "app-push" | "ivr" | "telegram" | "broadcast-media";

export interface Channel {
  id: ChannelId;
  name: string;
  /** Who can actually switch it on. Most of these are not ours to operate. */
  operatedBy: string;
  /** Share of the district population this bearer plausibly reaches. */
  reachFraction: number;
  /** Seconds from issue to arrival, order of magnitude. */
  latencySec: number;
  /** Does it need a list of subscribers before it can send anything? */
  needsSubscriberList: boolean;
  /** Can it carry the alert in a language the reader chose? */
  multilingual: boolean;
  /** Works on a phone that is not a smartphone. */
  featurePhone: boolean;
  note: string;
}

export const CHANNELS: Channel[] = [
  {
    id: "cell-broadcast",
    name: "Cell broadcast",
    operatedBy: "Telecom operators, on instruction from NDMA / SDMA",
    reachFraction: 0.92,
    latencySec: 10,
    needsSubscriberList: false,
    multilingual: true,
    featurePhone: true,
    note: "The only bearer that reaches a district in seconds without knowing who is in it. It is broadcast to a cell, not sent to a number, so there is no list to be missing from. India's CB-based system carries a limited set of languages per message; the number of <info> blocks the upstream alert carries is the ceiling on that.",
  },
  {
    id: "sms",
    name: "SMS",
    operatedBy: "Telecom operators via a registered sender",
    reachFraction: 0.34,
    latencySec: 900,
    needsSubscriberList: true,
    multilingual: true,
    featurePhone: true,
    note: "Needs a subscriber list, which means it reaches people who registered — not people who are there. At district scale the queue itself becomes the delay: fifteen minutes is optimistic for a few hundred thousand messages.",
  },
  {
    id: "app-push",
    name: "App notification",
    operatedBy: "This service",
    reachFraction: 0.08,
    latencySec: 5,
    needsSubscriberList: true,
    multilingual: true,
    featurePhone: false,
    note: "Fast and free, and reaches only people who already installed something before the emergency. Useful as a supplement, indefensible as a primary.",
  },
  {
    id: "ivr",
    name: "Outbound voice call (IVR)",
    operatedBy: "Telecom operators / state call centre",
    reachFraction: 0.21,
    latencySec: 1800,
    needsSubscriberList: true,
    multilingual: true,
    featurePhone: true,
    note: "The channel for someone who cannot read at all, on a phone that cannot render a screen. Slow and expensive per call, and the only one on this list that works for a person with no literacy in any script.",
  },
  {
    id: "telegram",
    name: "Telegram / messaging",
    operatedBy: "This service, via a bot",
    reachFraction: 0.05,
    latencySec: 4,
    needsSubscriberList: true,
    multilingual: true,
    featurePhone: false,
    note: "Effectively free and instant, and reaches a self-selected audience: journalists, volunteers, district staff. Better understood as a coordination channel than a public warning one.",
  },
  {
    id: "broadcast-media",
    name: "TV and radio crawl",
    operatedBy: "Prasar Bharati and private broadcasters",
    reachFraction: 0.46,
    latencySec: 600,
    needsSubscriberList: false,
    multilingual: true,
    featurePhone: true,
    note: "No list, wide reach, and it finds people who are not looking at a phone. It cannot be targeted below the broadcast region, so a district warning goes to a state.",
  },
];

export interface Fanout {
  channel: Channel;
  reached: number;
  /** Simulated outcome. Nothing is transmitted. */
  status: "delivered" | "degraded" | "unavailable";
  detail: string;
}

/** Model the fan-out of one alert. Deterministic, so the same alert always
 *  produces the same picture and a screenshot can be trusted. */
export function fanout(alert: Alert, opts?: { cellBroadcastAuthorised?: boolean }): Fanout[] {
  const pop = populationUnder(alert);
  const authorised = opts?.cellBroadcastAuthorised ?? true;

  return CHANNELS.map((c): Fanout => {
    if (c.id === "cell-broadcast" && !authorised) {
      return {
        channel: c,
        reached: 0,
        status: "unavailable",
        detail:
          "Not authorised. Cell broadcast is issued by the designated authority under the DM Act 2005, not by an application. Without that designation this channel does not exist for us.",
      };
    }
    const reached = Math.round(pop * c.reachFraction);
    const status: Fanout["status"] =
      c.reachFraction >= 0.4 ? "delivered" : c.reachFraction >= 0.15 ? "degraded" : "degraded";
    return {
      channel: c,
      reached,
      status,
      detail:
        c.needsSubscriberList
          ? `Reaches ${Math.round(c.reachFraction * 100)}% — those on the list, not those in the district.`
          : `Reaches ${Math.round(c.reachFraction * 100)}% with no list required.`,
    };
  });
}

/** The union across channels is not the sum: the same person is on several. This
 *  is the honest headline number, and it is always well short of everybody. */
export function estimatedUnionReach(alert: Alert, opts?: { cellBroadcastAuthorised?: boolean }): number {
  const pop = populationUnder(alert);
  // Complement of the product of misses. Assumes independence, which overstates
  // reach slightly, so this is an optimistic bound and is labelled as one.
  const miss = fanout(alert, opts).reduce(
    (m, f) => m * (1 - (f.status === "unavailable" ? 0 : f.channel.reachFraction)),
    1,
  );
  return Math.round(pop * (1 - miss));
}

export function districtOf(alert: Alert): District | undefined {
  return DISTRICT_BY_ID[alert.districtId];
}
