// -----------------------------------------------------------------------------
// PREPAREDNESS PLANS
// -----------------------------------------------------------------------------
// Content is derived from NDMA's published public guidance and IMD/NDRF advisory
// wording, rewritten for reading level. It is version-stamped: an answer given by
// the assistant can be traced to the revision of this file that produced it.
//
// Writing rules applied to every line here, and enforced on model output too:
//   - one instruction per line, imperative, present tense
//   - a concrete noun wherever possible ("Aadhaar card", not "documents")
//   - no clause before the verb
//   - "do not" spelled out; never "don't", which is lost by text-to-speech at speed
// -----------------------------------------------------------------------------

import type { HazardType } from "./districts";

export const PLAN_VERSION = "plan-2026.08.3";

export interface Plan {
  hazard: HazardType;
  /** The specific published document this guidance is derived from.
   *
   *  Adapted from VaradaAI (github.com/Sanamuni123/VaradaAI), which grounds a
   *  RAG assistant in named NDMA/APSDMA guideline PDFs and cites the document
   *  behind every recommended action. "Derived from NDMA guidance" is not a
   *  citation — it is a gesture at one. Naming the document lets a reader, or a
   *  government reviewer, check the line against its source. */
  source: { title: string; publisher: string };
  title: string;
  /** One sentence. What this hazard actually does to you. */
  premise: string;
  /** Before it happens. */
  kit: string[];
  /** When it is happening. Ordered — the order is the product. */
  during: string[];
  /** The things that kill people. Kept separate and visually distinct, because
   *  a person scanning under stress reads the red list first. */
  avoid: string[];
  /** After. The original portal omitted this entirely; most preventable harm in
   *  floods and earthquakes happens in the 48 hours after the event. */
  after: string[];
}

export const PLANS: Plan[] = [
  {
    hazard: "flood",
    source: { title: "National Disaster Management Guidelines: Management of Floods", publisher: "Published by NDMA" },
    title: "Flood",
    premise: "Water rises faster than people expect, and moving water is much stronger than it looks.",
    kit: [
      "Aadhaar card, bank passbook and land papers in a sealed plastic bag",
      "Drinking water for two days, and ORS packets",
      "Torch, and a power bank that is already charged",
      "Any daily medicine, in its strip, with the name readable",
      "A whistle — it carries further than a voice and costs nothing",
    ],
    during: [
      "Move to higher ground before the water reaches your door.",
      "Switch off the main electricity switch before you leave.",
      "Take the sealed bag and your medicines. Leave everything else.",
      "Tell one neighbour which way you are going.",
    ],
    avoid: [
      "Do not walk through moving water. Water at knee height can take you off your feet.",
      "Do not drive through a flooded road. Sixty centimetres of water floats a car.",
      "Do not go back inside for belongings.",
      "Do not touch any electrical switch with wet hands.",
    ],
    after: [
      "Do not drink tap water until the authority says it is safe. Boil it first.",
      "Do not switch the power back on until the wiring has dried and been checked.",
      "Throw away food that touched flood water, including sealed packets.",
      "Watch for fever or loose motions for a week. Report it early.",
    ],
  },
  {
    hazard: "cyclone",
    source: { title: "National Disaster Management Guidelines: Management of Cyclones", publisher: "Published by NDMA" },
    title: "Cyclone",
    premise: "The wind arrives before the storm surge, and the surge is what drowns people.",
    kit: [
      "Battery radio — mobile networks fail early in a cyclone",
      "Strong rope and a tarpaulin sheet",
      "Drinking water for three days, stored in filled containers",
      "Dry food that needs no cooking",
      "Every phone and power bank charged",
    ],
    during: [
      "Go to the cyclone shelter today, not tomorrow. Roads close before landfall.",
      "Fill every water container while the supply is still on.",
      "Board up glass windows and tie down loose tin sheets.",
      "Bring animals to a tethered, sheltered place.",
    ],
    avoid: [
      "Do not go outside during the calm eye. The wind returns from the opposite direction.",
      "Do not shelter under a tin roof, a hoarding or a tree.",
      "Do not stay in a kutcha house on the coastal strip.",
      "Do not put out to sea, even for a short trip.",
    ],
    after: [
      "Stay in the shelter until the district authority announces it is over.",
      "Treat every fallen wire as live.",
      "Boil drinking water. Coastal wells go saline after a surge.",
    ],
  },
  {
    hazard: "earthquake",
    source: { title: "National Disaster Management Guidelines: Management of Earthquakes", publisher: "Published by NDMA" },
    title: "Earthquake",
    premise: "There is no warning. What you did before the shaking is the whole of your preparation.",
    kit: [
      "Sturdy shoes and a torch kept beside your bed, not in a cupboard",
      "A whistle, to signal if you are trapped",
      "First aid kit and any daily medicine",
      "Heavy furniture bolted to the wall, especially in a bedroom",
    ],
    during: [
      "Drop to the floor.",
      "Cover — get under a sturdy table, or against an interior wall away from windows.",
      "Hold on until the shaking stops completely.",
      "Only then move to open ground, by the stairs.",
    ],
    avoid: [
      "Do not run outside while the ground is still moving. Most injuries happen in doorways and stairwells.",
      "Do not use a lift during or after shaking.",
      "Do not stand near a window, a bookshelf or an outside wall.",
      "Do not light a match. A gas leak you cannot smell is the reason.",
    ],
    after: [
      "Expect aftershocks. Keep the path from your bed to the door clear.",
      "Check for a gas smell before switching anything on.",
      "If you are trapped, tap on a pipe or blow the whistle. Do not shout — it exhausts you and fills your lungs with dust.",
    ],
  },
  {
    hazard: "heatwave",
    source: { title: "Guidelines for Preparation of Action Plan — Prevention and Management of Heat Wave", publisher: "Published by NDMA" },
    title: "Heatwave",
    premise: "Heat kills quietly. The person most at risk is usually alone and does not feel thirsty.",
    kit: [
      "ORS packets, at home and in the bag you carry",
      "Light, loose, light-coloured cotton clothes",
      "An umbrella or a cloth for your head outdoors",
      "A working fan, and a shaded room identified in advance",
    ],
    during: [
      "Drink water every hour, whether or not you feel thirsty.",
      "Stay indoors between 12 PM and 4 PM.",
      "Check on anyone over 65, or living alone, twice a day.",
      "Wet a cloth and keep it on the back of the neck.",
    ],
    avoid: [
      "Do not leave any person or animal in a parked vehicle, even for two minutes.",
      "Do not do outdoor physical work in the afternoon.",
      "Do not drink alcohol, tea or very sugary drinks to cool down.",
    ],
    after: [
      "If someone stops sweating, becomes confused, or their skin is hot and dry — that is heatstroke, not exhaustion.",
      "Move them to shade, wet them, fan them, and call 108 immediately.",
      "Do not wait to see if they improve.",
    ],
  },
  {
    hazard: "landslide",
    source: { title: "National Disaster Management Guidelines: Management of Landslides and Snow Avalanches", publisher: "Published by NDMA" },
    title: "Landslide",
    premise: "Slopes fail after the rain has stopped, not during it, and they give very little notice.",
    kit: [
      "Two days of food and water — a closed road is the normal outcome",
      "Torch and charged power bank",
      "Medicines, because the pharmacy may be on the other side of the slip",
    ],
    during: [
      "Move away from the base of the slope, not along it.",
      "If you hear a rumble or see trees tilting, move sideways across the slope, uphill if you can.",
      "Stop at the next town rather than continuing a hill journey.",
    ],
    avoid: [
      "Do not park or stand below a cut slope, even briefly.",
      "Do not drive through fresh debris. More usually follows within minutes.",
      "Do not assume a road is open because it was open an hour ago.",
    ],
    after: [
      "Stay off the slope. A failed slope commonly fails again.",
      "Report cracks in the ground or in walls to the patwari or the local authority.",
    ],
  },
  {
    hazard: "wildfire",
    source: { title: "National Action Plan on Forest Fires", publisher: "Published by MoEFCC" },
    title: "Wildfire",
    premise: "Fire moves uphill faster than a person can run. Leaving early is the entire strategy.",
    kit: [
      "N95 masks for smoke",
      "Documents in one grab bag, kept by the door",
      "Vehicle fuelled and parked facing the exit",
    ],
    during: [
      "Leave as soon as leaving is advised. Do not wait to see how bad it gets.",
      "Close all windows and doors before you go — it slows the fire entering.",
      "Take the downhill route if there is a choice.",
    ],
    avoid: [
      "Do not drive into smoke you cannot see through.",
      "Do not go uphill from a fire.",
      "Do not return for animals or belongings once you have left.",
    ],
    after: [
      "Watch for hot spots and re-ignition for two days.",
      "Do not walk through burnt ground in open shoes — the ash holds heat for a long time.",
    ],
  },
];

export const PLAN_BY_HAZARD = Object.fromEntries(PLANS.map((p) => [p.hazard, p])) as Record<HazardType, Plan | undefined>;
