// English — the source of truth. Every other locale is typed against this shape,
// so a missing key is a build error, not a blank space on a warning screen.
const en = {
  brand: "Suno",
  tagline: "The warning, in your language, out loud.",

  navHome: "Home", navAlerts: "Alerts", navPlan: "Plan", navFind: "Find", navHelp: "Help",

  band1: "FOR INFORMATION", band2: "STAY ALERT", band3: "BE PREPARED", band4: "EVACUATE NOW",
  level: "Level",

  allClear: "No warning for your area",
  allClearSub: "Nothing active right now. This page will change if that changes.",

  yourArea: "Your area", changeArea: "Change area",
  useMyLocation: "Use my location", locating: "Finding you…",
  locationDenied: "Location permission was refused. Choose your district instead.",

  timeToImpact: "Time to impact", started: "Already started", mins: "min", hours: "hr",
  issuedBy: "Issued by", measured: "Measured",

  whatToDo: "Do this now", whatNotToDo: "Do not do this", afterwards: "Afterwards",
  essentialKit: "Keep ready",

  listen: "Listen", stopListening: "Stop", replay: "Play again",

  findShelter: "Find shelter", shelters: "Shelters", nearest: "Nearest",
  capacity: "Capacity", spaceLeft: "space left", nearlyFull: "Nearly full", full: "Full",
  directions: "Directions", askFor: "Ask for",
  facWomen: "Separate space for women", facAccessible: "Step-free access",
  facMedical: "First aid on site", facLivestock: "Livestock accepted",
  facPower: "Generator", facWater: "Drinking water",

  callNow: "Call", emergencyNumbers: "Emergency numbers", tapToDial: "Tap a number to call",

  activeAlerts: "Active warnings", noAlerts: "No active warnings", updated: "Updated", ago: "ago",
  allIndia: "All India", nationalMap: "National map",

  ask: "Ask", askTitle: "Ask in your language",
  askSub: "Speak or type. You will get an answer read out loud.",
  askPlaceholder: "Type your question…",
  tapToSpeak: "Hold to speak", listening: "Listening…", thinking: "Working…",
  answeredRules: "Answered from the rule table",
  answeredModel: "Answered by the language model",
  answeredOffline: "Answered offline from the saved rule table",
  askDisclaimer: "This answers from the warnings and guidance already on this page. It does not decide whether you are safe.",
  suggested: "Try asking",
  q1: "Should I leave now?", q2: "Where is the nearest shelter?",
  q3: "What should I take with me?", q4: "Is it safe to drive?",

  markSafe: "Mark yourself safe", markSafeSub: "So your family can stop searching",
  mobileNumber: "Mobile number", sendCode: "Send code", enterCode: "Enter the 6-digit code",
  codeSentTo: "Code sent to", verify: "Verify", verified: "Done",
  safeRegistered: "Your number now shows as safe in this demo register.",
  invalidNumber: "Enter a 10-digit mobile number.", wrongCode: "That code did not match.",

  findPerson: "Find someone", findPersonSub: "Check whether a number has been marked safe",
  searchPlaceholder: "10-digit mobile number", searchBtn: "Search",
  foundSafe: "Marked safe", notFound: "No record for this number",
  notFoundSub: "This number has not been marked safe here. Try the helpline.",
  lastSeen: "Last updated",

  shareLocation: "Send my location", copied: "Link copied", sharing: "Opening share…",

  plans: "Get ready", choosePlan: "Choose a hazard",

  offline: "You are offline", offlineSub: "Showing the last update received.",
  lastUpdate: "Last update", online: "Back online",

  prototypeNotice: "Independent prototype",
  notGovt: "Not a government service. Not connected to any government system.",
  syntheticNotice: "All warnings, shelters and numbers on this screen are synthetic sample data.",
  whatIsReal: "What is real, what is not",

  howItRuns: "How this would actually run",
  language: "Language", chooseLanguage: "Choose your language",
  textSize: "Text size", dark: "Dark", light: "Light", readAloud: "Read aloud",

  sos: "SOS", sosConfirm: "Demo only — this will not place a real call.",
  cancel: "Cancel", close: "Close", back: "Back", next: "Next", done: "Done",
  demoControls: "Demo controls — for reviewers",
  calm: "Calm", watch: "Watch", act: "Act",

  langGapTitle: "This warning was issued in 2 languages.",
  langGapBody: "India has 22 scheduled languages. You are reading this one because you chose it — the upstream bulletin did not offer it.",

  // --- deterministic answer templates (rule table speaks with these) ---
  ansYesLeave: "Yes. Leave now, and do not wait.",
  ansNoLeave: "There is no order to leave your area right now.",
  ansStayAlert: "Stay alert. Do not travel unless you have to.",
  ansNearestShelter: "Nearest shelter: {name}. About {km} km away. {free} places free.",
  ansNoShelter: "No shelter is listed for your area here.",
  ansTakeIntro: "Take these three things with you:",
  ansTake1: "Your ID papers, in a sealed plastic bag",
  ansTake2: "Drinking water and your daily medicines",
  ansTake3: "A torch and a charged phone",
  ansDrivingNo: "No. Do not drive through water or fresh debris.",
  ansDrivingCare: "Only if you must. Do not drive through water.",
  ansWaterNo: "Do not drink tap water until it is declared safe. Boil it first.",
  ansTimeLeft: "About {n} minutes until it reaches you.",
  ansAlreadyStarted: "It has already started.",
  ansHelpline: "Call {number}.",
  ansWhatIsThis: "This is an independent prototype. It is not a government service and it decides nothing.",
  ansUnknown: "I could not match that to the guidance on this page.",
  ansSourceNote: "From the warning issued by {sender}.",
  ansPowerOff: "Switch off the main electricity switch before you leave.",
  ansCheckOthers: "Check on anyone old, ill, or living alone near you.",
  useTheTime: "This is how long you have. Use it in the order below.",
  translatedByModel: "Translated by model",
  translatedSaved: "Translated by model, saved on this device",
  translating: "Translating…",
  translationRejected: "Translation rejected by the validator — showing the original",
  translationUnavailable: "Translation unavailable — showing the original",
  sample: "Sample",
  openPortal: "Open the warning portal",
  chooseStart: "Choose where to start",
  chooseStartSub: "This portal changes completely depending on whether a disaster is active. Every option below is a real district — nothing is simulated.",
  useMyLocationInstead: "Use my location instead",
  startCalm: "No active warning. Preparedness and local information.",
  startWatch: "A hazard is developing. Advisories and checklists.",
  startAct: "Active Level 4 warning. Evacuation guidance and shelters.",
  emergency: "Emergency",
  defaultLabel: "Default",
  gapTitle: "The gap this closes",
  gapSlot: "The alert format has a slot for {n} languages.",
  gapFills: "The bulletin fills {m}.",
  gapBody: "CAP v1.2 — the standard Sachet, IMD and CWC already publish in — gives every alert a repeating info block, each with its own language. Multi-language delivery is not a feature request. It is a slot the format was designed with, left empty.",
  capNote: "Synthetic. Shaped as CAP v1.2, the format Sachet and IMD already publish, so the swap to a live feed is a parser change rather than a redesign.",
  skipToWarning: "Skip to the warning",
  gapLegend: "Filled: the two the bulletin is issued in. Outlined: the {k} this fills.",
  districtNote: "Choosing a district also switches the language to the one most people there read. Your coordinates are matched to the nearest district on your device and are never sent anywhere.",
  howItRunsSub: "The CAP feed, who is legally allowed to order an evacuation, what breaks at scale, and everything on this site that is synthetic.",
  districtShare: "{p}% of {s} reads {l}.",
  districtCovered: "This district is one of the two the bulletin already serves. Most are not.",
  districtNotCovered: "The warning for this district was issued in English and Hindi. It was not issued in {l}.",
  readThisIn: "Read this in {n}",
};

export type Dict = { [K in keyof typeof en]: string };
export default en;
