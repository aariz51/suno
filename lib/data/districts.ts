// -----------------------------------------------------------------------------
// DISTRICTS
// -----------------------------------------------------------------------------
// 74 districts, matching the coverage of the portal this prototype re-thinks.
//
// The `lang` field is the whole argument of this product. Every district here is
// tagged with the language most of its residents actually read. A flood warning
// for Golaghat that arrives in English is not a warning — it is a notification
// that something is wrong, in a language the reader has to find someone to
// translate. Selecting a district switches the entire interface to that
// language, because that is what the real system should do and does not.
//
// Coordinates are real (public geographic fact). Hazard profiles are real in
// kind — Chamoli does have landslides, Puri does get cyclones — but every
// ACTIVE alert in this prototype is synthetic. See /how-it-runs.
// -----------------------------------------------------------------------------

export type LangCode =
  | "en" | "hi" | "bn" | "as" | "or" | "ta" | "te" | "kn" | "ml" | "mr" | "gu" | "pa" | "ur";

export type HazardType =
  | "flood" | "cyclone" | "earthquake" | "landslide" | "heatwave"
  | "thunderstorm" | "drought" | "wildfire" | "coldwave" | "urban-flood";

export interface District {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** Language the majority of residents read. Drives automatic UI language. */
  lang: LangCode;
  /** Share of residents whose first language is `lang`, per Census 2011 language
   *  tables at state level. Used to state the language gap as a number. */
  langShare: number;
  hazards: HazardType[];
  /** Population, 2011 Census, district level, rounded. Used for the scale maths
   *  on /how-it-runs — not decoration. */
  pop: number;
}

export const DISTRICTS: District[] = [
  // --- National Capital Region -----------------------------------------------
  { id: "ghaziabad",   name: "Ghaziabad",              state: "Uttar Pradesh", lat: 28.6692, lng: 77.4538, lang: "hi", langShare: 80, hazards: ["urban-flood", "flood", "heatwave", "thunderstorm"], pop: 4681645 },
  { id: "new-delhi",   name: "New Delhi",              state: "Delhi",         lat: 28.6139, lng: 77.2090, lang: "hi", langShare: 81, hazards: ["urban-flood", "heatwave", "earthquake", "thunderstorm"], pop: 16787941 },
  { id: "noida",       name: "Noida / Greater Noida",  state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910, lang: "hi", langShare: 80, hazards: ["urban-flood", "heatwave", "earthquake"], pop: 1648115 },
  { id: "gurugram",    name: "Gurugram",               state: "Haryana",       lat: 28.4595, lng: 77.0266, lang: "hi", langShare: 88, hazards: ["urban-flood", "heatwave", "earthquake"], pop: 1514432 },
  { id: "faridabad",   name: "Faridabad",              state: "Haryana",       lat: 28.4089, lng: 77.3178, lang: "hi", langShare: 88, hazards: ["urban-flood", "heatwave"], pop: 1809733 },

  // --- Assam ------------------------------------------------------------------
  { id: "golaghat",    name: "Golaghat",               state: "Assam",         lat: 26.5100, lng: 93.9600, lang: "as", langShare: 61, hazards: ["flood", "landslide", "thunderstorm"], pop: 1066888 },
  { id: "guwahati",    name: "Guwahati",               state: "Assam",         lat: 26.1445, lng: 91.7362, lang: "as", langShare: 61, hazards: ["flood", "thunderstorm", "earthquake", "landslide"], pop: 963429 },
  { id: "lakhimpur",   name: "Lakhimpur",              state: "Assam",         lat: 27.2360, lng: 94.1100, lang: "as", langShare: 61, hazards: ["flood", "earthquake"], pop: 1042137 },
  { id: "dibrugarh",   name: "Dibrugarh",              state: "Assam",         lat: 27.4728, lng: 94.9120, lang: "as", langShare: 61, hazards: ["flood", "earthquake"], pop: 1326335 },
  { id: "silchar",     name: "Silchar",                state: "Assam",         lat: 24.8333, lng: 92.7789, lang: "bn", langShare: 74, hazards: ["flood", "earthquake", "landslide"], pop: 172830 },

  // --- Odisha -----------------------------------------------------------------
  { id: "puri",        name: "Puri",                   state: "Odisha",        lat: 19.8135, lng: 85.8312, lang: "or", langShare: 82, hazards: ["cyclone", "flood", "heatwave"], pop: 1698730 },
  { id: "bhubaneswar", name: "Bhubaneswar",            state: "Odisha",        lat: 20.2961, lng: 85.8245, lang: "or", langShare: 82, hazards: ["cyclone", "urban-flood", "heatwave"], pop: 885363 },
  { id: "cuttack",     name: "Cuttack",                state: "Odisha",        lat: 20.4625, lng: 85.8830, lang: "or", langShare: 82, hazards: ["flood", "cyclone", "heatwave"], pop: 2624470 },
  { id: "balasore",    name: "Balasore",               state: "Odisha",        lat: 21.4942, lng: 86.9336, lang: "or", langShare: 82, hazards: ["cyclone", "flood"], pop: 2320529 },
  { id: "berhampur",   name: "Berhampur",              state: "Odisha",        lat: 19.3150, lng: 84.7941, lang: "or", langShare: 82, hazards: ["cyclone", "heatwave", "flood"], pop: 355823 },

  // --- Maharashtra ------------------------------------------------------------
  { id: "mumbai",      name: "Mumbai",                 state: "Maharashtra",   lat: 19.0760, lng: 72.8777, lang: "mr", langShare: 69, hazards: ["urban-flood", "cyclone", "thunderstorm"], pop: 12442373 },
  { id: "pune",        name: "Pune",                   state: "Maharashtra",   lat: 18.5204, lng: 73.8567, lang: "mr", langShare: 69, hazards: ["urban-flood", "flood", "landslide"], pop: 9429408 },
  { id: "nagpur",      name: "Nagpur",                 state: "Maharashtra",   lat: 21.1458, lng: 79.0882, lang: "mr", langShare: 69, hazards: ["heatwave", "thunderstorm", "drought"], pop: 4653570 },
  { id: "nashik",      name: "Nashik",                 state: "Maharashtra",   lat: 19.9975, lng: 73.7898, lang: "mr", langShare: 69, hazards: ["flood", "drought", "thunderstorm"], pop: 6107187 },
  { id: "thane",       name: "Thane",                  state: "Maharashtra",   lat: 19.2183, lng: 72.9781, lang: "mr", langShare: 69, hazards: ["urban-flood", "cyclone", "landslide"], pop: 11060148 },

  // --- Uttarakhand ------------------------------------------------------------
  { id: "chamoli",     name: "Chamoli",                state: "Uttarakhand",   lat: 30.4000, lng: 79.3200, lang: "hi", langShare: 88, hazards: ["landslide", "flood", "earthquake", "coldwave"], pop: 391605 },
  { id: "dehradun",    name: "Dehradun",               state: "Uttarakhand",   lat: 30.3165, lng: 78.0322, lang: "hi", langShare: 88, hazards: ["landslide", "flood", "earthquake"], pop: 1696694 },
  { id: "haridwar",    name: "Haridwar",               state: "Uttarakhand",   lat: 29.9457, lng: 78.1642, lang: "hi", langShare: 88, hazards: ["flood", "earthquake"], pop: 1890422 },
  { id: "nainital",    name: "Nainital",               state: "Uttarakhand",   lat: 29.3803, lng: 79.4636, lang: "hi", langShare: 88, hazards: ["landslide", "wildfire", "earthquake"], pop: 954605 },
  { id: "rishikesh",   name: "Rishikesh",              state: "Uttarakhand",   lat: 30.0869, lng: 78.2676, lang: "hi", langShare: 88, hazards: ["flood", "landslide", "earthquake"], pop: 102138 },

  // --- Himachal Pradesh -------------------------------------------------------
  { id: "shimla",      name: "Shimla",                 state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, lang: "hi", langShare: 86, hazards: ["landslide", "earthquake", "coldwave", "wildfire"], pop: 814010 },
  { id: "manali",      name: "Manali",                 state: "Himachal Pradesh", lat: 32.2432, lng: 77.1892, lang: "hi", langShare: 86, hazards: ["landslide", "flood", "coldwave", "earthquake"], pop: 8096 },
  { id: "kullu",       name: "Kullu",                  state: "Himachal Pradesh", lat: 31.9578, lng: 77.1092, lang: "hi", langShare: 86, hazards: ["landslide", "flood", "earthquake"], pop: 437903 },
  { id: "dharamshala", name: "Dharamshala",            state: "Himachal Pradesh", lat: 32.2190, lng: 76.3234, lang: "hi", langShare: 86, hazards: ["landslide", "earthquake", "thunderstorm"], pop: 30764 },
  { id: "solan",       name: "Solan",                  state: "Himachal Pradesh", lat: 30.9045, lng: 77.0967, lang: "hi", langShare: 86, hazards: ["landslide", "earthquake", "wildfire"], pop: 580320 },

  // --- Uttar Pradesh ----------------------------------------------------------
  { id: "lucknow",     name: "Lucknow",                state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, lang: "hi", langShare: 80, hazards: ["heatwave", "urban-flood", "thunderstorm"], pop: 4589838 },
  { id: "kanpur",      name: "Kanpur",                 state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319, lang: "hi", langShare: 80, hazards: ["heatwave", "flood", "urban-flood"], pop: 4581268 },
  { id: "agra",        name: "Agra",                   state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081, lang: "hi", langShare: 80, hazards: ["heatwave", "flood", "thunderstorm"], pop: 4418797 },
  { id: "varanasi",    name: "Varanasi",               state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, lang: "hi", langShare: 80, hazards: ["flood", "heatwave"], pop: 3676841 },
  { id: "prayagraj",   name: "Prayagraj",              state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463, lang: "hi", langShare: 80, hazards: ["flood", "heatwave"], pop: 5954391 },
  { id: "bahraich",    name: "Bahraich",               state: "Uttar Pradesh", lat: 27.5743, lng: 81.5941, lang: "hi", langShare: 80, hazards: ["flood", "heatwave"], pop: 3487731 },

  // --- Bihar ------------------------------------------------------------------
  { id: "patna",       name: "Patna",                  state: "Bihar",         lat: 25.5941, lng: 85.1376, lang: "hi", langShare: 76, hazards: ["flood", "heatwave", "urban-flood"], pop: 5838465 },
  { id: "gaya",        name: "Gaya",                   state: "Bihar",         lat: 24.7914, lng: 85.0002, lang: "hi", langShare: 76, hazards: ["heatwave", "flood", "drought"], pop: 4391418 },
  { id: "muzaffarpur", name: "Muzaffarpur",            state: "Bihar",         lat: 26.1209, lng: 85.3647, lang: "hi", langShare: 76, hazards: ["flood", "heatwave", "thunderstorm"], pop: 4801062 },
  { id: "bhagalpur",   name: "Bhagalpur",              state: "Bihar",         lat: 25.2425, lng: 86.9842, lang: "hi", langShare: 76, hazards: ["flood", "heatwave"], pop: 3037766 },

  // --- West Bengal ------------------------------------------------------------
  { id: "kolkata",     name: "Kolkata",                state: "West Bengal",   lat: 22.5726, lng: 88.3639, lang: "bn", langShare: 86, hazards: ["cyclone", "urban-flood", "thunderstorm", "heatwave"], pop: 4496694 },
  { id: "howrah",      name: "Howrah",                 state: "West Bengal",   lat: 22.5958, lng: 88.2636, lang: "bn", langShare: 86, hazards: ["cyclone", "urban-flood", "flood"], pop: 4850029 },
  { id: "darjeeling",  name: "Darjeeling",             state: "West Bengal",   lat: 27.0410, lng: 88.2663, lang: "bn", langShare: 86, hazards: ["landslide", "earthquake", "thunderstorm"], pop: 1846823 },
  { id: "siliguri",    name: "Siliguri",               state: "West Bengal",   lat: 26.7271, lng: 88.3953, lang: "bn", langShare: 86, hazards: ["flood", "landslide", "earthquake"], pop: 513264 },
  { id: "digha",       name: "Digha",                  state: "West Bengal",   lat: 21.6270, lng: 87.5070, lang: "bn", langShare: 86, hazards: ["cyclone", "flood"], pop: 8107 },

  // --- Tamil Nadu -------------------------------------------------------------
  { id: "chennai",     name: "Chennai",                state: "Tamil Nadu",    lat: 13.0827, lng: 80.2707, lang: "ta", langShare: 89, hazards: ["cyclone", "urban-flood", "heatwave"], pop: 4646732 },
  { id: "coimbatore",  name: "Coimbatore",             state: "Tamil Nadu",    lat: 11.0168, lng: 76.9558, lang: "ta", langShare: 89, hazards: ["flood", "drought", "thunderstorm"], pop: 3458045 },
  { id: "madurai",     name: "Madurai",                state: "Tamil Nadu",    lat: 9.9252,  lng: 78.1198, lang: "ta", langShare: 89, hazards: ["heatwave", "flood", "drought"], pop: 3038252 },
  { id: "kanyakumari", name: "Kanyakumari",            state: "Tamil Nadu",    lat: 8.0883,  lng: 77.5385, lang: "ta", langShare: 89, hazards: ["cyclone", "landslide", "flood"], pop: 1870374 },

  // --- Kerala -----------------------------------------------------------------
  { id: "trivandrum",  name: "Thiruvananthapuram",     state: "Kerala",        lat: 8.5241,  lng: 76.9366, lang: "ml", langShare: 97, hazards: ["flood", "landslide", "cyclone"], pop: 3301427 },
  { id: "kochi",       name: "Kochi",                  state: "Kerala",        lat: 9.9312,  lng: 76.2673, lang: "ml", langShare: 97, hazards: ["urban-flood", "flood", "cyclone"], pop: 601574 },
  { id: "wayanad",     name: "Wayanad",                state: "Kerala",        lat: 11.6854, lng: 76.1320, lang: "ml", langShare: 97, hazards: ["landslide", "flood", "thunderstorm"], pop: 817420 },
  { id: "munnar",      name: "Munnar",                 state: "Kerala",        lat: 10.0889, lng: 77.0595, lang: "ml", langShare: 97, hazards: ["landslide", "flood"], pop: 68000 },
  { id: "kozhikode",   name: "Kozhikode",              state: "Kerala",        lat: 11.2588, lng: 75.7804, lang: "ml", langShare: 97, hazards: ["flood", "landslide", "cyclone"], pop: 3086293 },

  // --- Gujarat ----------------------------------------------------------------
  { id: "ahmedabad",   name: "Ahmedabad",              state: "Gujarat",       lat: 23.0225, lng: 72.5714, lang: "gu", langShare: 86, hazards: ["heatwave", "urban-flood", "earthquake"], pop: 7214225 },
  { id: "surat",       name: "Surat",                  state: "Gujarat",       lat: 21.1702, lng: 72.8311, lang: "gu", langShare: 86, hazards: ["flood", "cyclone", "urban-flood"], pop: 6081322 },
  { id: "vadodara",    name: "Vadodara",               state: "Gujarat",       lat: 22.3072, lng: 73.1812, lang: "gu", langShare: 86, hazards: ["flood", "heatwave"], pop: 4165626 },
  { id: "rajkot",      name: "Rajkot",                 state: "Gujarat",       lat: 22.3039, lng: 70.8022, lang: "gu", langShare: 86, hazards: ["heatwave", "cyclone", "drought"], pop: 3804558 },
  { id: "porbandar",   name: "Porbandar",              state: "Gujarat",       lat: 21.6417, lng: 69.6293, lang: "gu", langShare: 86, hazards: ["cyclone", "drought"], pop: 585449 },

  // --- Punjab / Haryana / Chandigarh ------------------------------------------
  { id: "amritsar",    name: "Amritsar",               state: "Punjab",        lat: 31.6340, lng: 74.8723, lang: "pa", langShare: 90, hazards: ["flood", "heatwave", "coldwave"], pop: 2490656 },
  { id: "ludhiana",    name: "Ludhiana",               state: "Punjab",        lat: 30.9010, lng: 75.8573, lang: "pa", langShare: 90, hazards: ["flood", "heatwave", "coldwave"], pop: 3498739 },
  { id: "chandigarh",  name: "Chandigarh",             state: "Punjab/Haryana",lat: 30.7333, lng: 76.7794, lang: "hi", langShare: 68, hazards: ["urban-flood", "earthquake", "heatwave"], pop: 1055450 },
  { id: "ambala",      name: "Ambala",                 state: "Haryana",       lat: 30.3752, lng: 76.7821, lang: "hi", langShare: 88, hazards: ["flood", "heatwave", "coldwave"], pop: 1128350 },

  // --- Jammu & Kashmir / Ladakh -----------------------------------------------
  { id: "srinagar",    name: "Srinagar",               state: "J&K",           lat: 34.0837, lng: 74.7973, lang: "ur", langShare: 53, hazards: ["flood", "earthquake", "coldwave", "landslide"], pop: 1236829 },
  { id: "jammu",       name: "Jammu",                  state: "J&K",           lat: 32.7266, lng: 74.8570, lang: "hi", langShare: 60, hazards: ["flood", "earthquake", "heatwave"], pop: 1529958 },
  { id: "sonamarg",    name: "Sonamarg",               state: "J&K",           lat: 34.3000, lng: 75.3000, lang: "ur", langShare: 53, hazards: ["landslide", "coldwave", "flood"], pop: 3200 },
  { id: "leh",         name: "Leh",                    state: "Ladakh",        lat: 34.1526, lng: 77.5771, lang: "ur", langShare: 40, hazards: ["flood", "coldwave", "earthquake", "landslide"], pop: 133487 },

  // --- Rajasthan --------------------------------------------------------------
  { id: "jaipur",      name: "Jaipur",                 state: "Rajasthan",     lat: 26.9124, lng: 75.7873, lang: "hi", langShare: 91, hazards: ["heatwave", "urban-flood", "drought"], pop: 6626178 },
  { id: "jodhpur",     name: "Jodhpur",                state: "Rajasthan",     lat: 26.2389, lng: 73.0243, lang: "hi", langShare: 91, hazards: ["heatwave", "drought", "thunderstorm"], pop: 3687165 },
  { id: "udaipur",     name: "Udaipur",                state: "Rajasthan",     lat: 24.5854, lng: 73.7125, lang: "hi", langShare: 91, hazards: ["heatwave", "flood", "drought"], pop: 3068420 },

  // --- Karnataka / Telangana --------------------------------------------------
  { id: "bengaluru",   name: "Bengaluru",              state: "Karnataka",     lat: 12.9716, lng: 77.5946, lang: "kn", langShare: 66, hazards: ["urban-flood", "thunderstorm", "drought"], pop: 9621551 },
  { id: "hyderabad",   name: "Hyderabad",              state: "Telangana",     lat: 17.3850, lng: 78.4867, lang: "te", langShare: 77, hazards: ["urban-flood", "heatwave", "thunderstorm"], pop: 6809970 },
];

export const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d])) as Record<string, District>;

export const DEFAULT_DISTRICT_ID = "golaghat";

/** Nearest district to a coordinate — used after a real geolocation fix.
 *  Equirectangular approximation; at India's latitudes the error over the
 *  distances that matter here is well under a kilometre, and we only need a
 *  ranking, not a measurement. */
export function nearestDistrict(lat: number, lng: number): District {
  let best = DISTRICTS[0];
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const x = (d.lng - lng) * Math.cos(((d.lat + lat) * Math.PI) / 360);
    const y = d.lat - lat;
    const dist = x * x + y * y;
    if (dist < bestD) { bestD = dist; best = d; }
  }
  return best;
}
