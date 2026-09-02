// -----------------------------------------------------------------------------
// THE RULE TABLE
// -----------------------------------------------------------------------------
// This file is the reason the assistant is trustworthy, and it runs BEFORE the
// language model on every single request.
//
// The twenty questions below are the ones people actually ask in the first ten
// minutes of an emergency. Each is matched by keyword, in every language the app
// supports, and answered by ASSEMBLING TEXT THAT ALREADY EXISTS in lib/data —
// the active CAP alert, the preparedness plan, the shelter register. No
// generation happens. That means:
//
//   * identical input always returns an identical answer
//   * every number in the answer came from the data file it is quoting
//   * it works with no API key, and it works with no network
//
// Only input that matches NOTHING here reaches the model, and what the model
// returns is then put through lib/guard.ts before anyone sees it.
//
// Version-stamped so an answer can be traced to the revision that produced it.
// -----------------------------------------------------------------------------

import { type Alert, level, alertsFor } from "./data/alerts";
import { PLAN_BY_HAZARD, PLAN_VERSION } from "./data/plans";
import { sheltersFor } from "./data/shelters";
import { DISTRICT_BY_ID } from "./data/districts";
import { HELPLINES } from "./data/helplines";

export const RULES_VERSION = "rules-2026.08.5";
export const CORPUS_VERSION = `${RULES_VERSION}+${PLAN_VERSION}`;

export type Intent =
  | "should_i_leave" | "where_shelter" | "what_to_take" | "safe_to_drive"
  | "what_happened" | "how_long" | "who_to_call" | "is_it_over"
  | "water_safe" | "children_elderly" | "livestock" | "power_gas"
  | "shelter_facilities" | "mark_safe" | "find_person" | "after_event"
  | "night_safety" | "medicine" | "documents" | "unknown";

export interface RuleAnswer {
  intent: Intent;
  /** The answer, as ordered lines. Never a paragraph — a person under stress
   *  reads a list and skips a paragraph. */
  lines: string[];
  /** Optional lines rendered as the "do not" block. */
  avoid?: string[];
  /** Helplines to surface with this answer. Only ever from HELPLINES. */
  numbers?: string[];
  /** Which data file this answer was assembled from. Shown in the UI. */
  source: string;
}

// -----------------------------------------------------------------------------
// Keyword tables. Deliberately generous: a false match to a NEARBY intent costs
// almost nothing (the answer is still grounded and still correct-ish), while a
// miss sends the question to the model and costs latency and a network hop.
// -----------------------------------------------------------------------------

const K: Record<Exclude<Intent, "unknown">, string[]> = {
  should_i_leave: [
    "leave", "evacuate", "go now", "should i go", "escape", "move out", "vacate",
    "निकल", "जाऊं", "जाना चाहिए", "भागना", "खाली",
    "ওলাই", "যাম", "যাব", "বেরো", "ছাড়",
    "ବାହାରି", "ଯିବି", "ଛାଡ଼",
    "கிளம்ப", "வெளியேற", "போகணும்",
    "బయలుదేర", "వెళ్ళాలా", "ఖాళీ",
    "ಹೊರಡ", "ಬಿಡಬೇಕ", "ಖಾಲಿ",
    "മാറണോ", "പോകണോ", "ഒഴിഞ്ഞ",
    "निघाव", "सोडाव",
    "નીકળ", "જવું",
    "ਨਿਕਲ", "ਜਾਵਾਂ",
    "نکل", "جاؤں",
  ],
  where_shelter: [
    "shelter", "camp", "safe place", "where to go", "relief", "refuge",
    "शरण", "कैंप", "राहत", "कहाँ जाऊं", "सुरक्षित जगह",
    "আশ্ৰয়", "আশ্রয়", "শিবিৰ", "শিবির", "ক’ত", "কোথায়",
    "ଆଶ୍ରୟ", "ଶିବିର", "କେଉଁଠି",
    "முகாம்", "தங்க", "எங்கே",
    "శిబిర", "ఎక్కడ", "ఆశ్రయ",
    "ಶಿಬಿರ", "ಎಲ್ಲಿ", "ಆಶ್ರಯ",
    "ക്യാമ്പ്", "എവിടെ", "അഭയ",
    "निवारा", "कुठे",
    "આશ્રય", "ક્યાં",
    "ਪਨਾਹ", "ਕਿੱਥੇ",
    "پناہ", "کہاں",
  ],
  what_to_take: [
    "take", "carry", "bring", "pack", "what should i take", "kit", "belongings",
    "ले जाऊं", "साथ", "सामान", "किट",
    "লৈ যাম", "সঙ্গে", "নিয়ে",
    "ନେବି", "ସାଙ୍ଗରେ",
    "எடுத்து", "கொண்டு",
    "తీసుకె", "వెంట",
    "ತೆಗೆದುಕೊಂಡು", "ಜೊತೆ",
    "കൊണ്ടുപോക", "ഒപ്പം",
    "न्याव", "सोबत",
    "લઈ જ", "સાથે",
    "ਲੈ ਜਾ", "ਨਾਲ",
    "لے جاؤں", "ساتھ",
  ],
  safe_to_drive: [
    "drive", "driving", "car", "vehicle", "road", "bike", "travel", "bus",
    "गाड़ी", "सड़क", "चलाना", "यात्रा",
    "গাড়ী", "গাড়ি", "ৰাস্তা", "রাস্তা",
    "ଗାଡ଼ି", "ରାସ୍ତା",
    "வண்டி", "சாலை", "ஓட்ட",
    "వాహన", "రోడ్డు", "నడప",
    "ವಾಹನ", "ರಸ್ತೆ", "ಚಲಾಯಿ",
    "വാഹന", "റോഡ്", "ഓടിക്ക",
    "गाडी", "रस्ता",
    "ગાડી", "રસ્તો",
    "ਗੱਡੀ", "ਸੜਕ",
    "گاڑی", "سڑک",
  ],
  what_happened: [
    "what happened", "what is happening", "why", "what is the warning", "situation",
    "क्या हुआ", "क्यों", "चेतावनी क्या",
    "কি হৈছে", "কি হয়েছে", "কিয়", "কেন",
    "କଣ ହେଲା", "କାହିଁକି",
    "என்ன நடந்த", "ஏன்",
    "ఏమైంది", "ఎందుకు",
    "ಏನಾಯಿತು", "ಯಾಕೆ",
    "എന്ത് സംഭവിച്ചു", "എന്തിന",
    "काय झाल", "का",
    "શું થયું", "કેમ",
    "ਕੀ ਹੋਇਆ", "ਕਿਉਂ",
    "کیا ہوا", "کیوں",
  ],
  how_long: [
    "how long", "how much time", "when", "time left", "impact", "kitna time",
    "कितना समय", "कब", "कितनी देर",
    "কিমান সময়", "কত সময়", "কেতিয়া", "কখন",
    "କେତେ ସମୟ", "କେବେ",
    "எவ்வளவு நேரம்", "எப்போது",
    "ఎంత సమయం", "ఎప్పుడు",
    "ಎಷ್ಟು ಸಮಯ", "ಯಾವಾಗ",
    "എത്ര സമയം", "എപ്പോൾ",
    "किती वेळ", "केव्हा",
    "કેટલો સમય", "ક્યારે",
    "ਕਿੰਨਾ ਸਮਾਂ", "ਕਦੋਂ",
    "کتنا وقت", "کب",
  ],
  who_to_call: [
    "call", "phone", "number", "helpline", "contact", "ambulance", "police", "fire",
    "फ़ोन", "फोन", "नंबर", "हेल्पलाइन", "एम्बुलेंस", "पुलिस",
    "ফোন", "নম্বৰ", "নম্বর", "হেল্পলাইন",
    "ଫୋନ", "ନମ୍ବର",
    "அழை", "எண்", "உதவி எண்",
    "ఫోన్", "నంబర్",
    "ಫೋನ್", "ಸಂಖ್ಯೆ",
    "ഫോൺ", "നമ്പർ",
    "फोन", "क्रमांक",
    "ફોન", "નંબર",
    "ਫ਼ੋਨ", "ਨੰਬਰ",
    "فون", "نمبر",
  ],
  is_it_over: [
    "is it over", "safe now", "can i go back", "all clear", "finished",
    "खत्म", "वापस जा", "सुरक्षित हो गया",
    "শেষ", "উভতি", "ফিরে",
    "ଶେଷ", "ଫେରି",
    "முடிந்த", "திரும்ப",
    "అయిపోయ", "తిరిగి",
    "ಮುಗಿ", "ವಾಪಸ್",
    "കഴിഞ്ഞ", "തിരികെ",
    "संपल", "परत",
    "પૂરું", "પાછા",
    "ਖ਼ਤਮ", "ਵਾਪਸ",
    "ختم", "واپس",
  ],
  water_safe: [
    "water", "drink", "drinking water", "thirsty", "boil",
    "पानी", "पीने", "उबाल",
    "পানী", "জল", "খোৱা", "ফুটিয়ে",
    "ପାଣି", "ପିଇବା",
    "தண்ணீர்", "குடி",
    "నీరు", "తాగ",
    "ನೀರು", "ಕುಡಿ",
    "വെള്ളം", "കുടിക്ക",
    "पाणी", "पिण्या",
    "પાણી", "પીવા",
    "ਪਾਣੀ", "ਪੀਣ",
    "پانی", "پینے",
  ],
  children_elderly: [
    "child", "children", "baby", "old", "elderly", "parent", "grandmother", "grandfather",
    "बच्चा", "बच्चे", "बुजुर्ग", "बूढ़",
    "শিশু", "ল’ৰা", "বৃদ্ধ", "বাচ্চা",
    "ପିଲା", "ବୃଦ୍ଧ",
    "குழந்தை", "வயதான",
    "పిల్ల", "వృద్ధ",
    "ಮಗು", "ವೃದ್ಧ",
    "കുട്ടി", "വൃദ്ധ",
    "मूल", "वृद्ध",
    "બાળક", "વૃદ્ધ",
    "ਬੱਚ", "ਬਜ਼ੁਰਗ",
    "بچہ", "بزرگ",
  ],
  livestock: [
    "cow", "cattle", "buffalo", "goat", "animal", "livestock", "dog",
    "गाय", "पशु", "जानवर", "भैंस", "बकरी",
    "গৰু", "গরু", "পশু",
    "ଗାଈ", "ପଶୁ",
    "மாடு", "கால்நடை",
    "ఆవు", "పశువు",
    "ಹಸು", "ಜಾನುವಾರು",
    "പശു", "കന്നുകാലി",
    "गाय", "जनावर",
    "ગાય", "પશુ",
    "ਗਾਂ", "ਪਸ਼ੂ",
    "گائے", "مویشی",
  ],
  power_gas: [
    "power", "electricity", "current", "switch", "gas", "cylinder", "wire",
    "बिजली", "स्विच", "गैस", "सिलेंडर", "तार",
    "বিজুলী", "বিদ্যুৎ", "গেছ", "গ্যাস",
    "ବିଦ୍ୟୁତ", "ଗ୍ୟାସ",
    "மின்சாரம்", "சுவிட்ச்", "எரிவாயு",
    "కరెంట్", "విద్యుత్", "గ్యాస్",
    "ವಿದ್ಯುತ್", "ಸ್ವಿಚ್", "ಗ್ಯಾಸ್",
    "വൈദ്യുതി", "സ്വിച്ച്", "ഗ്യാസ്",
    "वीज", "गॅस",
    "વીજળી", "ગેસ",
    "ਬਿਜਲੀ", "ਗੈਸ",
    "بجلی", "گیس",
  ],
  shelter_facilities: [
    "facility", "toilet", "women", "separate", "wheelchair", "ramp", "medical", "doctor",
    "सुविधा", "शौचालय", "महिला", "अलग", "डॉक्टर",
    "সুবিধা", "মহিলা", "পৃথক", "ডাক্তার",
    "ସୁବିଧା", "ମହିଳା", "ଡାକ୍ତର",
    "வசதி", "பெண்", "மருத்துவ",
    "సౌకర్య", "మహిళ", "వైద్య",
    "ಸೌಲಭ್ಯ", "ಮಹಿಳೆ", "ವೈದ್ಯ",
    "സൗകര്യ", "സ്ത്രീ", "ഡോക്ടർ",
    "सुविधा", "महिला",
    "સુવિધા", "મહિલા",
    "ਸਹੂਲਤ", "ਔਰਤ",
    "سہولت", "خواتین",
  ],
  mark_safe: [
    "i am safe", "mark safe", "tell my family", "register safe", "inform family",
    "मैं सुरक्षित", "परिवार को बताओ", "सुरक्षित दर्ज",
    "মই সুৰক্ষিত", "আমি নিরাপদ", "পৰিয়াল", "পরিবার",
    "ମୁଁ ସୁରକ୍ଷିତ", "ପରିବାର",
    "நான் பாதுகாப்ப", "குடும்பத்த",
    "నేను క్షేమం", "కుటుంబ",
    "ನಾನು ಸುರಕ್ಷಿತ", "ಕುಟುಂಬ",
    "ഞാൻ സുരക്ഷിത", "കുടുംബ",
    "मी सुरक्षित", "कुटुंब",
    "હું સુરક્ષિત", "પરિવાર",
    "ਮੈਂ ਸੁਰੱਖਿਅਤ", "ਪਰਿਵਾਰ",
    "میں محفوظ", "خاندان",
  ],
  find_person: [
    "find my", "missing", "search for", "where is my", "lost", "not reachable",
    "ढूंढ", "लापता", "कहाँ है मेरा", "गुम",
    "বিচাৰি", "নিখোঁজ", "হেৰাই", "খুঁজ",
    "ଖୋଜ", "ନିଖୋଜ",
    "தேட", "காணவில்ல",
    "వెతక", "కనబడ",
    "ಹುಡುಕ", "ಕಾಣೆ",
    "തിരയ", "കാണാനില്ല",
    "शोध", "हरवल",
    "શોધ", "ગુમ",
    "ਲੱਭ", "ਗੁੰਮ",
    "تلاش", "لاپتہ",
  ],
  after_event: [
    "after", "afterwards", "clean", "return home", "rebuild", "damage",
    "बाद में", "साफ", "घर लौट", "नुकसान",
    "পিছত", "পরে", "পৰিষ্কাৰ", "ক্ষতি",
    "ପରେ", "ପରିଷ୍କାର", "କ୍ଷତି",
    "பிறகு", "சுத்தம்", "சேதம்",
    "తర్వాత", "శుభ్రం", "నష్టం",
    "ನಂತರ", "ಸ್ವಚ್ಛ", "ಹಾನಿ",
    "ശേഷം", "വൃത്തി", "നാശം",
    "नंतर", "स्वच्छ", "नुकसान",
    "પછી", "સાફ", "નુકસાન",
    "ਬਾਅਦ", "ਸਾਫ਼", "ਨੁਕਸਾਨ",
    "بعد", "صاف", "نقصان",
  ],
  night_safety: [
    "night", "sleep", "tonight", "dark", "torch",
    "रात", "सोना", "आज रात", "अंधेरा", "टॉर्च",
    "ৰাতি", "রাত", "শুই", "ঘুম",
    "ରାତି", "ଶୋଇ",
    "இரவு", "தூங்க",
    "రాత్రి", "నిద్ర",
    "ರಾತ್ರಿ", "ನಿದ್ರ",
    "രാത്രി", "ഉറങ്ങ",
    "रात्री", "झोप",
    "રાત", "ઊંઘ",
    "ਰਾਤ", "ਸੌਣ",
    "رات", "سونا",
  ],
  medicine: [
    "medicine", "tablet", "insulin", "sick", "hospital", "injury", "wound", "fever",
    "दवा", "गोली", "बीमार", "अस्पताल", "चोट", "बुखार",
    "ঔষধ", "অসুখ", "চিকিৎসালয়", "হাসপাতাল", "জ্বৰ", "জ্বর",
    "ଔଷଧ", "ଅସୁସ୍ଥ", "ହସପିଟାଲ", "ଜ୍ୱର",
    "மருந்து", "நோய்", "மருத்துவமனை", "காய்ச்சல்",
    "మందు", "అనారోగ్య", "ఆసుపత్రి", "జ్వరం",
    "ಔಷಧ", "ಅನಾರೋಗ್ಯ", "ಆಸ್ಪತ್ರೆ", "ಜ್ವರ",
    "മരുന്ന്", "അസുഖ", "ആശുപത്രി", "പനി",
    "औषध", "आजारी", "रुग्णालय", "ताप",
    "દવા", "બીમાર", "હોસ્પિટલ", "તાવ",
    "ਦਵਾਈ", "ਬਿਮਾਰ", "ਹਸਪਤਾਲ", "ਬੁਖ਼ਾਰ",
    "دوا", "بیمار", "ہسپتال", "بخار",
  ],
  documents: [
    "aadhaar", "aadhar", "document", "papers", "passbook", "certificate", "id",
    "आधार", "कागज", "दस्तावेज", "पासबुक",
    "আধাৰ", "আধার", "কাগজ", "নথি",
    "ଆଧାର", "କାଗଜ",
    "ஆதார்", "ஆவண",
    "ఆధార్", "పత్ర",
    "ಆಧಾರ್", "ದಾಖಲೆ",
    "ആധാർ", "രേഖ",
    "आधार", "कागदपत्र",
    "આધાર", "કાગળ",
    "ਆਧਾਰ", "ਕਾਗਜ਼",
    "آدھار", "کاغذ",
  ],
};

// -----------------------------------------------------------------------------

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function classify(question: string): Intent {
  const q = norm(question);
  let best: Intent = "unknown";
  let bestScore = 0;
  for (const [intent, keys] of Object.entries(K) as [Exclude<Intent, "unknown">, string[]][]) {
    let score = 0;
    for (const k of keys) if (q.includes(k.toLowerCase())) score += k.length;
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  // A single two-letter incidental match is not a match. Require real overlap.
  return bestScore >= 3 ? best : "unknown";
}

// -----------------------------------------------------------------------------
// Answer assembly. Every line below is copied from a data file, never written
// here and never generated.
// -----------------------------------------------------------------------------

function minutesToOnset(a: Alert): number | null {
  return a.onsetOffsetMin;
}

export function answerFromRules(question: string, districtId: string): RuleAnswer | null {
  const intent = classify(question);
  if (intent === "unknown") return null;

  const district = DISTRICT_BY_ID[districtId];
  const alerts = alertsFor(districtId);
  const top = alerts[0] ?? null;
  const plan = top ? PLAN_BY_HAZARD[top.hazard] : undefined;
  const shelters = sheltersFor(districtId);
  const src = `${CORPUS_VERSION} · ${top ? top.identifier : "no active alert"}`;

  const noAlert: RuleAnswer = {
    intent,
    lines: [
      `There is no active warning for ${district?.name ?? "this district"} right now.`,
      "Nothing here needs you to act at this moment.",
      "If you can see danger in front of you, do not wait for a warning. Call 112.",
    ],
    numbers: ["112"],
    source: src,
  };

  switch (intent) {
    case "should_i_leave": {
      if (!top) return noAlert;
      const lv = level(top);
      if (lv === 4) {
        return { intent, lines: ["Yes. Leave now.", ...top.instruction], avoid: top.avoid, numbers: ["112", "1078"], source: src };
      }
      if (lv === 3) {
        return {
          intent,
          lines: [
            "Not yet — but be ready to leave at short notice.",
            ...top.instruction,
          ],
          avoid: top.avoid, numbers: ["1078"], source: src,
        };
      }
      return {
        intent,
        lines: [
          "No. There is no evacuation advice for your area right now.",
          `The current level is ${lv}: ${lv === 2 ? "stay alert" : "for information"}.`,
          ...top.instruction.slice(0, 2),
        ],
        numbers: ["1078"], source: src,
      };
    }

    case "where_shelter": {
      if (shelters.length === 0) {
        return { intent, lines: [
          `No shelter is listed for ${district?.name ?? "this district"} in this prototype.`,
          "Call the district control room and ask where the nearest relief centre is.",
        ], numbers: ["1077", "1078"], source: src };
      }
      const lines = [`${shelters.length} shelter${shelters.length > 1 ? "s" : ""} near ${district?.name}:`];
      for (const s of shelters.slice(0, 3)) {
        const free = s.capacity - s.occupied;
        lines.push(`${s.name} — about ${s.km} km. ${free > 0 ? `${free} places free` : "Full"}.`);
      }
      lines.push("Open the Shelters screen for directions and what each one has.");
      return { intent, lines, numbers: ["1078"], source: src };
    }

    case "what_to_take": {
      const kit = plan?.kit ?? PLAN_BY_HAZARD["flood"]!.kit;
      return { intent, lines: ["Take these, and nothing more:", ...kit], avoid: ["Do not go back for anything else once you have left."], source: src };
    }

    case "safe_to_drive": {
      if (!top) return noAlert;
      if (top.hazard === "flood" || top.hazard === "urban-flood") {
        return { intent, lines: [
          "No. Do not drive through flood water.",
          "Sixty centimetres of water will float a car. You cannot see how deep it is or whether the road under it is still there.",
          "If you are already driving and water is across the road, turn around.",
        ], avoid: top.avoid, numbers: ["112"], source: src };
      }
      if (top.hazard === "landslide") {
        return { intent, lines: [
          "No. Do not begin a hill journey today.",
          "If you are already on the road, stop at the next town rather than continuing.",
          "The road may close in both directions with no notice.",
        ], avoid: top.avoid, numbers: ["1077"], source: src };
      }
      if (top.hazard === "cyclone") {
        return { intent, lines: [
          "Only to reach a shelter, and only now — not later.",
          "Roads close before landfall and stay closed.",
        ], avoid: top.avoid, numbers: ["1078"], source: src };
      }
      return { intent, lines: ["Travel only if you must.", ...top.instruction.slice(0, 2)], avoid: top.avoid, source: src };
    }

    case "what_happened": {
      if (!top) return noAlert;
      return { intent, lines: [
        top.headline + ".",
        top.measure ? `${top.measure.label}: ${top.measure.value} — ${top.measure.threshold}.` : "",
        `Issued by ${top.senderName}.`,
        `This is a Level ${level(top)} warning.`,
      ].filter(Boolean), numbers: ["1078"], source: src };
    }

    case "how_long": {
      if (!top) return noAlert;
      const m = minutesToOnset(top);
      if (m === null) return { intent, lines: ["It has already started.", ...top.instruction.slice(0, 2)], numbers: ["112"], source: src };
      const txt = m < 60 ? `about ${m} minutes` : `about ${Math.round(m / 60)} hours`;
      return { intent, lines: [
        `You have ${txt} before impact is expected.`,
        "Use that time for these, in this order:",
        ...top.instruction,
      ], avoid: top.avoid, numbers: ["112"], source: src };
    }

    case "who_to_call": {
      const primary = HELPLINES.filter((h) => h.primary);
      return { intent, lines: [
        "These are the numbers that matter:",
        ...primary.map((h) => `${h.number} — ${h.name}. ${h.detail}.`),
      ], numbers: primary.map((h) => h.number), source: src };
    }

    case "is_it_over": {
      if (!top) return noAlert;
      return { intent, lines: [
        "Not yet. This warning is still active.",
        "Wait for the district authority to announce it is over. Do not judge it by looking outside.",
        ...(plan?.after ?? []).slice(0, 2),
      ], numbers: ["1077"], source: src };
    }

    case "water_safe": {
      return { intent, lines: [
        "Boil drinking water before you drink it, for at least one minute at a rolling boil.",
        "Do not drink tap water until the authority says it is safe.",
        "Throw away food and sealed packets that touched flood water.",
        "Keep ORS packets ready. Watch for loose motions and fever for a week.",
      ], numbers: ["104", "108"], source: src };
    }

    case "children_elderly": {
      return { intent, lines: [
        "Keep children within arm's reach. Do not send anyone back for anything.",
        "Write your phone number on a child's arm in permanent ink before you move.",
        "Check on anyone over 65 or living alone before you leave, not after.",
        "Take their daily medicines in the original strip so the name is readable.",
      ], numbers: ["108", "1098", "14567"], source: src };
    }

    case "livestock": {
      const withAnimals = shelters.filter((s) => s.facilities.livestock);
      const lines = [
        "Untie animals so they can move to higher ground on their own. Do not leave them tied.",
        "Do not delay your own evacuation for animals.",
      ];
      if (withAnimals.length) {
        lines.push(`These shelters accept livestock: ${withAnimals.map((s) => s.name).join("; ")}.`);
      }
      return { intent, lines, numbers: ["1078"], source: src };
    }

    case "power_gas": {
      return { intent, lines: [
        "Switch off the main electricity switch before water enters, and before you leave.",
        "Close the gas cylinder valve.",
        "Treat every fallen wire as live, even after the power has gone.",
        "Do not switch the power back on until the wiring has dried and been checked.",
      ], avoid: ["Do not touch any switch with wet hands.", "Do not light a match if you suspect a gas leak."], numbers: ["101", "112"], source: src };
    }

    case "shelter_facilities": {
      if (!shelters.length) return noAlert;
      const lines = ["What the nearby shelters have:"];
      for (const s of shelters.slice(0, 3)) {
        const f = s.facilities;
        const has = [
          f.women && "separate space for women", f.accessible && "step-free access",
          f.medical && "first aid", f.livestock && "livestock accepted",
          f.power && "generator", f.water && "drinking water",
        ].filter(Boolean).join(", ");
        lines.push(`${s.name}: ${has || "no facilities recorded"}.`);
      }
      return { intent, lines, numbers: ["1078"], source: src };
    }

    case "mark_safe": {
      return { intent, lines: [
        "Open the Find screen and choose 'Mark yourself safe'.",
        "Enter your mobile number and confirm the code.",
        "Anyone who searches that number will then see that you are safe.",
        "In this prototype nothing is sent anywhere — the record stays in this browser.",
      ], source: src };
    }

    case "find_person": {
      return { intent, lines: [
        "Open the Find screen and enter the mobile number.",
        "If that number has been marked safe, you will see when it was marked.",
        "If there is no record, that does not mean anything has happened. It only means nobody has marked it.",
        "For a missing person, call the district control room.",
      ], numbers: ["1077", "112"], source: src };
    }

    case "after_event": {
      const after = plan?.after ?? PLAN_BY_HAZARD["flood"]!.after;
      return { intent, lines: ["After it passes:", ...after], numbers: ["104"], source: src };
    }

    case "night_safety": {
      return { intent, lines: [
        "Keep shoes and a torch beside where you sleep.",
        "Keep the path from your bed to the door clear.",
        "Charge every phone and power bank before you sleep.",
        "Sleep on the upper floor if there is one and flooding is expected.",
      ], source: src };
    }

    case "medicine": {
      const withMed = shelters.filter((s) => s.facilities.medical);
      const lines = [
        "Take daily medicines in the original strip, so the name is readable.",
        "For a medical emergency call 108. It is free and it works from any phone.",
      ];
      if (withMed.length) lines.push(`First aid is available at: ${withMed.map((s) => s.name).join("; ")}.`);
      return { intent, lines, numbers: ["108", "104"], source: src };
    }

    case "documents": {
      return { intent, lines: [
        "Put your ID papers, bank passbook and land papers in one sealed plastic bag.",
        "Photograph each one on your phone as a backup before you move.",
        "Take the bag. Do not go back for a document once you have left.",
      ], source: src };
    }
  }
}

/** The corpus the model is allowed to see, and nothing else. Assembled fresh
 *  per request so the model can never be grounded on stale data. */
export function buildContext(districtId: string) {
  const district = DISTRICT_BY_ID[districtId];
  const alerts = alertsFor(districtId);
  const shelters = sheltersFor(districtId);
  const plans = [...new Set(alerts.map((a) => a.hazard))].map((h) => PLAN_BY_HAZARD[h]).filter(Boolean);
  return {
    district: district ? { name: district.name, state: district.state, language: district.lang } : null,
    alerts: alerts.map((a) => ({
      identifier: a.identifier, level: level(a), event: a.event, headline: a.headline,
      issuedBy: a.senderName, description: a.description,
      instruction: a.instruction, avoid: a.avoid, measure: a.measure,
      minutesToImpact: a.onsetOffsetMin,
    })),
    shelters: shelters.map((s) => ({
      name: s.name, km: s.km, open: s.open,
      placesFree: s.capacity - s.occupied, facilities: s.facilities,
    })),
    plans,
    helplines: HELPLINES.map((h) => ({ number: h.number, name: h.name })),
    corpusVersion: CORPUS_VERSION,
  };
}

// -----------------------------------------------------------------------------
// Alias kept for app/api/ask/route.ts, which imports buildGrounding(). Same
// function, one name per call site rather than two implementations.
// -----------------------------------------------------------------------------
export const buildGrounding = buildContext;
