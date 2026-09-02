"use client";

// -----------------------------------------------------------------------------
// APPLICATION STATE
// -----------------------------------------------------------------------------
// One context, deliberately. This is a five-screen product; a state library here
// would be more machinery than the problem has.
//
// Two decisions worth naming:
//
//   PHASE is derived, not stored. The page ground, the header, and what the home
//   screen shows are all a function of the highest active alert level for the
//   selected district. There is no way to be in a district with a Level 4 warning
//   and see a calm screen, because that state does not exist in the model.
//
//   LANGUAGE follows the district by default. Choosing Golaghat puts the app in
//   Assamese without the person finding a language menu, because a person in a
//   flood should not have to. An explicit language choice overrides it and is
//   remembered.
// -----------------------------------------------------------------------------

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import {
  DEFAULT_DISTRICT_ID, DISTRICT_BY_ID, type LangCode,
} from "@/lib/data/districts";
import { alertsFor, level, type Alert } from "@/lib/data/alerts";
import { LANG_BY_CODE, ensureFont, loadDict, type Dict } from "@/lib/i18n";
import en from "@/lib/i18n/locales/en";

export type Phase = "calm" | "watch" | "act";
export type Tab = "home" | "alerts" | "plan" | "find" | "help";
export type FontSize = "s" | "m" | "l" | "xl";

export interface SafeRecord {
  number: string;
  at: number;
}

interface Store {
  t: Dict;
  lang: LangCode;
  setLang: (l: LangCode, explicit?: boolean) => void;
  langExplicit: boolean;

  districtId: string;
  setDistrictId: (id: string) => void;

  alerts: Alert[];
  top: Alert | null;
  /** Always derived from the highest active alert level for the selected
   *  district. There is deliberately no override: a screen that says "no
   *  warning" above a Level 4 card is the incoherence this product exists to
   *  argue against, so the state simply cannot be faked. The reviewer control
   *  jumps districts instead. */
  phase: Phase;

  tab: Tab;
  setTab: (t: Tab) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;

  online: boolean;
  lastSync: number | null;

  safeNumbers: SafeRecord[];
  addSafeNumber: (n: string) => void;

  speaking: string | null;
  speak: (id: string, text: string) => void;
  stopSpeaking: () => void;
  ttsAvailable: boolean;
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

const LS = {
  lang: "suno.lang",
  langExplicit: "suno.langExplicit",
  district: "suno.district",
  theme: "suno.theme",
  fs: "suno.fs",
  safe: "suno.safe",
  sync: "suno.sync",
};

/** localStorage that cannot throw. Private windows and locked-down browsers
 *  throw on access, and a warning screen must not die for a preference. */
const store = {
  get(k: string): string | null {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); } catch { /* preference lost, app fine */ }
  },
};

/** The first supported language among the browser's own preferences, else
 *  English. Used only before a person has chosen a district — after that the
 *  district decides, which is the product's actual argument. */
function browserLang(): LangCode {
  try {
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const p of prefs) {
      const base = (p || "").toLowerCase().split("-")[0] as LangCode;
      if (LANG_BY_CODE[base]) return base;
    }
  } catch {
    /* fall through */
  }
  return "en";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const [langExplicit, setLangExplicit] = useState(false);
  const [t, setT] = useState<Dict>(en);
  const [districtId, setDistrictIdState] = useState(DEFAULT_DISTRICT_ID);
  const [tab, setTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSizeState] = useState<FontSize>("m");
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [safeNumbers, setSafeNumbers] = useState<SafeRecord[]>([]);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [ttsAvailable, setTtsAvailable] = useState(false);

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ---- language ------------------------------------------------------------
  const applyLang = useCallback(async (l: LangCode) => {
    const meta = LANG_BY_CODE[l];
    if (!meta) return;
    ensureFont(meta);
    const d = await loadDict(l);
    setT(d);
    setLangState(l);
    const root = document.documentElement;
    root.lang = l;
    root.dir = meta.dir;
    root.setAttribute("data-script", meta.script);
  }, []);

  const setLang = useCallback((l: LangCode, explicit = true) => {
    if (explicit) {
      setLangExplicit(true);
      store.set(LS.langExplicit, "1");
      store.set(LS.lang, l);
    }
    void applyLang(l);
  }, [applyLang]);

  // ---- district ------------------------------------------------------------
  const setDistrictId = useCallback((id: string) => {
    if (!DISTRICT_BY_ID[id]) return;
    setDistrictIdState(id);
    store.set(LS.district, id);
    // The whole argument of the product: the language follows the place, unless
    // the reader has said otherwise.
    if (!langExplicit) {
      const d = DISTRICT_BY_ID[id];
      if (d?.lang) void applyLang(d.lang);
    }
  }, [langExplicit, applyLang]);

  // ---- boot ---------------------------------------------------------------
  useEffect(() => {
    const savedDistrict = store.get(LS.district);
    const savedLang = store.get(LS.lang) as LangCode | null;
    const explicit = store.get(LS.langExplicit) === "1";
    const savedTheme = store.get(LS.theme) as "light" | "dark" | null;
    const savedFs = store.get(LS.fs) as FontSize | null;
    const savedSafe = store.get(LS.safe);
    const savedSync = store.get(LS.sync);

    const did = savedDistrict && DISTRICT_BY_ID[savedDistrict] ? savedDistrict : DEFAULT_DISTRICT_ID;
    setDistrictIdState(did);

    setLangExplicit(explicit);

    // Language on a FIRST visit is a genuinely awkward case, and getting it
    // wrong is loud: before anyone has told us where they are, "the language
    // follows the district" would hand a brand-new visitor the default
    // district's language and render the welcome screen in a script they may
    // not read. A person cannot choose their language from a modal they cannot
    // read, so that is the one screen the rule must not apply to.
    //
    // So: an explicit saved choice wins; then a district the person actually
    // chose in a previous session; then the browser's own languages, if any of
    // them is one we ship; then English.
    const chosenBefore = store.get(LS.district) !== null;
    const initialLang: LangCode =
      explicit && savedLang ? savedLang
      : chosenBefore ? (DISTRICT_BY_ID[did]?.lang ?? "en")
      : browserLang();
    void applyLang(initialLang);

    if (savedTheme) setTheme(savedTheme);
    if (savedFs) setFontSizeState(savedFs);
    if (savedSafe) {
      try { setSafeNumbers(JSON.parse(savedSafe)); } catch { /* ignore */ }
    }
    setLastSync(savedSync ? Number(savedSync) : Date.now());
    if (!savedSync) store.set(LS.sync, String(Date.now()));

    setOnline(navigator.onLine);
    setTtsAvailable(typeof window !== "undefined" && "speechSynthesis" in window);

    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [applyLang]);

  // ---- theme + font size are root attributes, so CSS owns the cascade ------
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    store.set(LS.theme, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-fs", fontSize);
    store.set(LS.fs, fontSize);
  }, [fontSize]);

  // ---- derived phase ------------------------------------------------------
  const alerts = useMemo(() => alertsFor(districtId), [districtId]);
  const top = alerts[0] ?? null;

  const dataPhase: Phase = useMemo(() => {
    if (!top) return "calm";
    const lv = level(top);
    if (lv === 4) return "act";
    if (lv === 3 || lv === 2) return "watch";
    return "calm";
  }, [top]);

  const phase = dataPhase;

  // NOTE: data-phase is deliberately NOT set here. The severity ground belongs to
  // the warning screen alone; setting it from the provider (which wraps every
  // route) painted the landing page and the engineering note in evacuation red.
  // components/AppShell.tsx sets it on mount and clears it on unmount.

  // ---- text to speech -----------------------------------------------------
  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setSpeaking(null);
  }, []);

  const speak = useCallback((id: string, text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const meta = LANG_BY_CODE[lang];
      u.lang = meta?.bcp47 ?? "en-IN";
      // Slower than default. This is being read to someone who is frightened
      // and may be hearing it through a phone speaker in the rain.
      u.rate = 0.92;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang === u.lang) ??
        voices.find((v) => v.lang?.startsWith(lang)) ??
        voices.find((v) => v.lang === "en-IN");
      if (match) u.voice = match;
      u.onstart = () => setSpeaking(id);
      u.onend = () => setSpeaking(null);
      u.onerror = () => setSpeaking(null);
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch {
      setSpeaking(null);
    }
  }, [lang]);

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  // ---- safe register ------------------------------------------------------
  const addSafeNumber = useCallback((n: string) => {
    setSafeNumbers((prev) => {
      const next = [{ number: n, at: Date.now() }, ...prev.filter((r) => r.number !== n)].slice(0, 50);
      store.set(LS.safe, JSON.stringify(next));
      return next;
    });
  }, []);

  const setFontSize = useCallback((f: FontSize) => setFontSizeState(f), []);
  const toggleTheme = useCallback(() => setTheme((x) => (x === "dark" ? "light" : "dark")), []);

  const value: Store = {
    t, lang, setLang, langExplicit,
    districtId, setDistrictId,
    alerts, top, phase,
    tab, setTab,
    theme, toggleTheme, fontSize, setFontSize,
    online, lastSync,
    safeNumbers, addSafeNumber,
    speaking, speak, stopSpeaking, ttsAvailable,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
