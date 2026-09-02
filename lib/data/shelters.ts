// -----------------------------------------------------------------------------
// SHELTERS — synthetic, but shaped like the real register
// -----------------------------------------------------------------------------
// India has a genuine national inventory of relief shelters: Multi-Purpose
// Cyclone Shelters (MPCS) built under NCRMP along the east coast, plus schools
// and panchayat buildings designated by each District Disaster Management
// Authority. The fields below mirror what that register actually holds, because
// the interesting product question is not "show a pin" — it is "what does a
// person need to know before walking three kilometres to it with a child".
//
// Capacity, occupancy and facility flags are the fields that decide whether the
// walk is worth making, and they are the fields the current public interfaces
// do not show. Every value here is synthetic. See /how-it-runs.
// -----------------------------------------------------------------------------

export interface Shelter {
  id: string;
  districtId: string;
  name: string;
  kind: "MPCS" | "School" | "Community Hall" | "Panchayat Building" | "Stadium";
  lat: number;
  lng: number;
  /** Straight-line km from the district centroid. Displayed as approximate,
   *  because a straight line is not a walk and we should not pretend it is. */
  km: number;
  capacity: number;
  occupied: number;
  open: boolean;
  /** The facts that decide whether this shelter works for a given person. */
  facilities: {
    women: boolean;      // separate space for women
    accessible: boolean; // ramp / ground floor
    medical: boolean;    // trained first aid on site
    livestock: boolean;  // the reason many farmers refuse to evacuate
    power: boolean;      // generator
    water: boolean;      // drinking water on site
  };
  /** Who to ask for on arrival. A name and a role, not a switchboard. */
  contact: { role: string; phone: string };
}

export const SHELTERS: Shelter[] = [
  // --- Golaghat, Assam (flood) ---
  { id: "gl-1", districtId: "golaghat", name: "Golaghat Bezbaruah Higher Secondary School", kind: "School", lat: 26.5185, lng: 93.9622, km: 1.2, capacity: 400, occupied: 118, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: false, power: true, water: true },
    contact: { role: "Shelter in-charge", phone: "1078" } },
  { id: "gl-2", districtId: "golaghat", name: "Numaligarh Community Hall", kind: "Community Hall", lat: 26.6210, lng: 93.7280, km: 4.6, capacity: 250, occupied: 240, open: true,
    facilities: { women: true, accessible: false, medical: false, livestock: true, power: true, water: true },
    contact: { role: "Panchayat secretary", phone: "1078" } },
  { id: "gl-3", districtId: "golaghat", name: "Dergaon Model Higher Secondary School", kind: "School", lat: 26.7000, lng: 93.9700, km: 8.9, capacity: 600, occupied: 62, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: true, power: true, water: true },
    contact: { role: "Shelter in-charge", phone: "1078" } },

  // --- Puri, Odisha (cyclone) ---
  { id: "pu-1", districtId: "puri", name: "Baliapanda Multi-Purpose Cyclone Shelter", kind: "MPCS", lat: 19.8010, lng: 85.8130, km: 1.8, capacity: 1000, occupied: 210, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: true, power: true, water: true },
    contact: { role: "MPCS caretaker", phone: "1078" } },
  { id: "pu-2", districtId: "puri", name: "Chakratirtha Road Government School", kind: "School", lat: 19.8060, lng: 85.8350, km: 2.4, capacity: 350, occupied: 40, open: true,
    facilities: { women: true, accessible: false, medical: false, livestock: false, power: false, water: true },
    contact: { role: "Head teacher", phone: "1078" } },
  { id: "pu-3", districtId: "puri", name: "Satapada MPCS", kind: "MPCS", lat: 19.6660, lng: 85.4560, km: 9.7, capacity: 800, occupied: 0, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: true, power: true, water: true },
    contact: { role: "MPCS caretaker", phone: "1078" } },

  // --- Chamoli, Uttarakhand (landslide) ---
  { id: "ch-1", districtId: "chamoli", name: "Pipalkoti Inter College", kind: "School", lat: 30.4270, lng: 79.4260, km: 2.1, capacity: 220, occupied: 55, open: true,
    facilities: { women: true, accessible: false, medical: true, livestock: false, power: true, water: true },
    contact: { role: "Shelter in-charge", phone: "1078" } },
  { id: "ch-2", districtId: "chamoli", name: "Gopeshwar Sports Stadium Relief Camp", kind: "Stadium", lat: 30.4090, lng: 79.3200, km: 5.4, capacity: 500, occupied: 90, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: true, power: true, water: true },
    contact: { role: "Camp officer", phone: "1078" } },

  // --- Ghaziabad, UP (urban flood) ---
  { id: "gz-1", districtId: "ghaziabad", name: "Government Higher Secondary School, Raj Nagar", kind: "School", lat: 28.6820, lng: 77.4270, km: 1.2, capacity: 300, occupied: 24, open: true,
    facilities: { women: true, accessible: true, medical: false, livestock: false, power: true, water: true },
    contact: { role: "Shelter in-charge", phone: "1078" } },
  { id: "gz-2", districtId: "ghaziabad", name: "Kavi Nagar Community Centre", kind: "Community Hall", lat: 28.6720, lng: 77.4290, km: 2.5, capacity: 150, occupied: 143, open: true,
    facilities: { women: true, accessible: false, medical: false, livestock: false, power: true, water: true },
    contact: { role: "Ward officer", phone: "1078" } },
  { id: "gz-3", districtId: "ghaziabad", name: "Modinagar Panchayat Bhavan", kind: "Panchayat Building", lat: 28.8320, lng: 77.5780, km: 11.4, capacity: 180, occupied: 8, open: true,
    facilities: { women: false, accessible: false, medical: false, livestock: true, power: false, water: true },
    contact: { role: "Panchayat secretary", phone: "1078" } },

  // --- Wayanad, Kerala ---
  { id: "wy-1", districtId: "wayanad", name: "Kalpetta Government Higher Secondary School", kind: "School", lat: 11.6080, lng: 76.0830, km: 3.0, capacity: 300, occupied: 12, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: false, power: true, water: true },
    contact: { role: "Shelter in-charge", phone: "1078" } },

  // --- Guwahati, Assam ---
  { id: "gw-1", districtId: "guwahati", name: "Pandu College Relief Centre", kind: "School", lat: 26.1650, lng: 91.6900, km: 4.2, capacity: 450, occupied: 30, open: true,
    facilities: { women: true, accessible: true, medical: true, livestock: false, power: true, water: true },
    contact: { role: "Shelter in-charge", phone: "1078" } },
];

export function sheltersFor(districtId: string): Shelter[] {
  return SHELTERS.filter((s) => s.districtId === districtId).sort((a, b) => a.km - b.km);
}

/** Capacity headroom for a district — the number that tells you whether the
 *  advice "go to a shelter" is actually available to everyone being told it.
 *  This is used on /how-it-runs to make the scale problem concrete. */
export function shelterHeadroom(districtId: string) {
  const s = sheltersFor(districtId);
  const capacity = s.reduce((n, x) => n + x.capacity, 0);
  const occupied = s.reduce((n, x) => n + x.occupied, 0);
  return { capacity, occupied, free: capacity - occupied, count: s.length };
}
