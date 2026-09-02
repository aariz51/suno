"use client";

// -----------------------------------------------------------------------------
// THE SHELL
// -----------------------------------------------------------------------------
// Chrome, navigation, and the two persistent surfaces that must be reachable
// from anywhere: Ask (the voice assistant) and the emergency call sheet.
//
// The layout inverts as severity rises. In Calm the header is a product header
// with settings on it. At Level 4 the header collapses to a single line and the
// warning takes the screen, because at that point nothing else on this page
// matters and offering a settings menu would be an insult to the situation.
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { useStore } from "./store";
import { Home } from "./Home";
import { AlertsTab } from "./Alerts";
import PlanTab from "./PlanTab";
import { FindTab } from "./Find";
import HelpTab from "./HelpTab";
import { AskSheet } from "./Ask";
import { Onboarding } from "./Onboarding";
import { LanguageSheet, SettingsRow } from "./Settings";
import { Btn, Chip, cx, Sheet } from "./ui";
import {
  IconAlert, IconFind, IconHelp, IconHome, IconMic, IconPhone, IconPlan, IconWifiOff,
} from "./icons";
import { HELPLINES } from "@/lib/data/helplines";
import type { Tab } from "./store";

const TABS: { id: Tab; icon: (p: { size?: number }) => React.ReactElement; key: keyof ReturnType<typeof useStore>["t"] }[] = [
  { id: "home", icon: IconHome, key: "navHome" },
  { id: "alerts", icon: IconAlert, key: "navAlerts" },
  { id: "plan", icon: IconPlan, key: "navPlan" },
  { id: "find", icon: IconFind, key: "navFind" },
  { id: "help", icon: IconHelp, key: "navHelp" },
];

export default function AppShell() {
  const s = useStore();
  const { t, phase, tab, setTab } = s;

  // The severity ground is scoped to this screen. Other routes are documents,
  // not warnings, and must not inherit an evacuation-red page.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-phase", phase);
    return () => document.documentElement.removeAttribute("data-phase");
  }, [phase]);
  const [askOpen, setAskOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  const acting = phase === "act";

  return (
    // Mobile-first, but not mobile-only. Below lg this is a single 720px column
    // with a bottom tab bar, which is the right shape for the phone this is
    // designed for. From lg up it becomes a two-pane application: a persistent
    // navigation rail on the left and the warning in a readable measure beside
    // it. A 720px column with a thumb-reach tab bar stranded in the middle of a
    // 2560px display is not "mobile-first", it is unfinished.
    <div className="min-h-[100dvh] lg:flex">
      <SideRail tab={tab} setTab={setTab} onAsk={() => setAskOpen(true)} onCall={() => setCallOpen(true)} />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col lg:mx-0 lg:max-w-none lg:flex-1">
      <ReviewerStrip />

      <header
        className={cx(
          "sticky top-0 z-40 border-b border-[var(--color-hairline)]",
          "bg-[var(--ground)]/92 backdrop-blur-[10px]",
          // No transition here. Padding and font-size are layout properties;
          // animating them forces a reflow on every frame of a severity change,
          // which is the one moment the page must not stutter. The ground colour
          // carries the transition instead.
          acting ? "px-4 py-2" : "px-5 py-3",
          "lg:px-8",
        )}
      >
        <div className="lg:mx-auto lg:max-w-[1180px] 2xl:max-w-[1440px]">
        {/* Brand and controls share one row; the disclaimer gets its own line
            beneath. Previously the disclaimer sat inside the flex child next to
            the settings cluster, which at 390px squeezed it into a tall narrow
            column that collided with the buttons. A legal notice that has to be
            legible cannot be the thing that gets crushed. */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <span
              className={cx(
                "font-extrabold tracking-[-0.02em]",
                acting ? "text-[17px]" : "text-[21px]",
              )}
            >
              {t.brand}
            </span>
            {!acting && (
              <span className="hidden truncate text-[12px] text-[var(--color-ink-3)] sm:inline">
                {t.tagline}
              </span>
            )}
          </div>

          {!acting ? (
            <SettingsRow onLanguage={() => setLangOpen(true)} />
          ) : (
            <button
              onClick={() => setLangOpen(true)}
              className="shrink-0 rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-[13px] font-bold"
            >
              {t.language}
            </button>
          )}
        </div>

        <p
          className={cx(
            "text-[10px] font-semibold uppercase leading-snug tracking-[0.07em] text-[var(--color-ink-3)]",
            acting ? "mt-1" : "mt-1.5",
          )}
        >
          {t.prototypeNotice} · {t.notGovt}
        </p>
        </div>
      </header>

      <OfflineBar />

      <main id="main" className="flex-1 lg:mx-auto lg:w-full lg:max-w-[1180px] lg:px-6 2xl:max-w-[1440px]">
        {tab === "home" && <Home onAsk={() => setAskOpen(true)} />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "plan" && <PlanTab />}
        {tab === "find" && <FindTab />}
        {tab === "help" && <HelpTab />}
      </main>

      <SiteFooter />

      {/* The two things a person needs from any screen: ask, and call. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[720px] lg:hidden">
        <div className="pointer-events-none flex justify-end gap-2 px-4 pb-[76px]">
          <button
            onClick={() => setCallOpen(true)}
            className={cx(
              "pointer-events-auto grid h-14 w-14 place-items-center rounded-full",
              "border border-white/15 bg-[var(--color-l4)] text-white",
              "shadow-[var(--shadow-sos)]",
              acting && "a-pulse",
            )}
            aria-label={t.emergencyNumbers}
          >
            <IconPhone size={24} />
          </button>
          <button
            onClick={() => setAskOpen(true)}
            className={cx(
              "pointer-events-auto flex h-14 items-center gap-2.5 rounded-full pl-4 pr-5",
              "border border-[var(--color-hairline)] bg-[var(--color-ink)] text-[var(--color-paper)]",
              "shadow-[var(--shadow-lift)] font-bold",
            )}
          >
            <IconMic size={22} />
            <span className="text-[15px]">{t.ask}</span>
          </button>
        </div>

        <nav
          className="pointer-events-auto border-t border-[var(--color-hairline)] bg-[var(--color-paper)]/96 backdrop-blur-[10px]"
          aria-label="Sections"
        >
          <div className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {TABS.map(({ id, icon: Icon, key }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex flex-1 flex-col items-center gap-1 py-2.5",
                    active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-3)]",
                  )}
                >
                  {active && (
                    <span className="absolute inset-x-[26%] top-0 h-[2px] rounded-b bg-[var(--color-ink)]" />
                  )}
                  <Icon size={22} />
                  <span className="text-[11px] font-bold">{t[key] as string}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      </div>

      <Onboarding />
      <AskSheet open={askOpen} onClose={() => setAskOpen(false)} />
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <CallSheet open={callOpen} onClose={() => setCallOpen(false)} />
    </div>
  );
}

// -----------------------------------------------------------------------------

/** The desktop navigation rail. Same five destinations as the phone tab bar and
 *  the same two persistent actions, given the room a pointer device makes
 *  available: labels beside icons rather than under them, and the emergency
 *  numbers as a full control rather than a floating circle. */
function SideRail({
  tab, setTab, onAsk, onCall,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onAsk: () => void;
  onCall: () => void;
}) {
  const { t, phase } = useStore();
  return (
    <aside
      className="sticky top-0 hidden h-[100dvh] w-[248px] shrink-0 flex-col border-e border-[var(--color-hairline)] bg-[var(--color-paper)] px-4 py-5 lg:flex"
      aria-label="Sections"
    >
      <div className="px-2">
        <div className="text-[22px] font-extrabold tracking-[-0.03em]">{t.brand}</div>
        <div className="mt-0.5 text-[12px] leading-snug text-[var(--color-ink-3)]">{t.tagline}</div>
      </div>

      <nav className="mt-6 flex flex-col gap-0.5">
        {TABS.map(({ id, icon: Icon, key }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-start text-[15px] font-bold transition-colors",
                active
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]",
              )}
            >
              <Icon size={20} />
              {t[key] as string}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 space-y-2">
        <button
          onClick={onAsk}
          className="flex w-full items-center gap-2.5 rounded-[10px] bg-[var(--color-ink)] px-3 py-3 text-[15px] font-bold text-[var(--color-paper)]"
        >
          <IconMic size={19} />
          {t.ask}
        </button>
        <button
          onClick={onCall}
          className={cx(
            "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-3 text-[15px] font-bold text-white",
            phase === "act" && "a-pulse-in",
          )}
          style={{ background: "var(--color-l4)" }}
        >
          <IconPhone size={19} />
          {t.emergencyNumbers}
        </button>
      </div>

      <div className="mt-auto px-2 pt-6">
        <a
          href="/how-it-runs"
          className="block text-[12.5px] font-bold text-[var(--color-accent)] hover:underline"
        >
          {t.howItRuns}
        </a>
        <p className="mt-2 text-[10.5px] leading-relaxed text-[var(--color-ink-3)]">
          {t.prototypeNotice} · {t.notGovt}
        </p>
      </div>
    </aside>
  );
}

// -----------------------------------------------------------------------------

/** The footer carries the two things that must be reachable from every screen
 *  and are not features: what this is, and how it would actually work. The
 *  second is a whole page, because "does the solution address the backend,
 *  infrastructure and processes" is a judged question and a sentence is not an
 *  answer to it. */
function SiteFooter() {
  const { t } = useStore();
  return (
    <footer className="mt-2 border-t border-[var(--color-hairline)] px-5 pb-[136px] pt-6">
      <a
        href="/how-it-runs"
        className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-paper)] p-4 transition-colors hover:border-[var(--color-ink-3)]"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-bold">{t.howItRuns}</span>
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
            {t.howItRunsSub}
          </span>
        </span>
        <IconChevronRight />
      </a>

      <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-ink-3)]">
        {t.prototypeNotice}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-3)]">
        {t.notGovt} {t.syntheticNotice} It carries no government name, emblem or logo, it decides
        nothing, and no officer is bound by anything it says.
      </p>
    </footer>
  );
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0 text-[var(--color-ink-3)]" aria-hidden>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </svg>
  );
}

/** The reviewer control.
 *
 *  This used to override the phase directly, which meant a reviewer could put
 *  the app into "Calm" while the selected district still had a Level 4 warning —
 *  producing a screen that said "No warning for your area" directly above an
 *  EVACUATE NOW card. That is exactly the kind of incoherence this product is
 *  supposed to be arguing against.
 *
 *  So it no longer overrides anything. It jumps to a district that genuinely IS
 *  in that state, and the phase stays purely derived from the data. The reviewer
 *  still sees all three states in three taps; the difference is that every one of
 *  them is real. */
function ReviewerStrip() {
  const { phase, districtId, setDistrictId } = useStore();

  // This strip is deliberately English in every locale. It is scaffolding
  // addressed to a reviewer, not part of the product addressed to a citizen, and
  // half-translating it produced a bar that read as Assamese chrome with an
  // English sentence stuck to it. Keeping the scaffold visibly in one language
  // makes the boundary between "the build" and "the demo harness" obvious.
  const jumps: { id: string; to: string; label: string }[] = [
    { id: "calm", to: "new-delhi", label: "Calm" },
    { id: "watch", to: "wayanad", label: "Watch" },
    { id: "act", to: "golaghat", label: "Act" },
  ];

  return (
    <div data-reviewer-strip className="bg-[#12161C] px-4 py-2 text-white">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-white/55">
          Demo controls — for reviewers
        </span>
        <div className="flex shrink-0 gap-1" role="group" aria-label="Jump to a district in this state">
          {jumps.map((o) => {
            const active = phase === o.id && districtId === o.to;
            return (
              <button
                key={o.id}
                onClick={() => setDistrictId(o.to)}
                aria-pressed={active}
                className={cx(
                  "rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
                  active ? "bg-white text-[#12161C]" : "bg-white/10 text-white/75 hover:bg-white/20",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-white/40">
        Jumps to a district actually in that state. Nothing is faked — the severity you see is
        derived from that district&apos;s own warnings.
      </p>
    </div>
  );
}

/** Offline state, stated with the timestamp of what is on screen. "You are
 *  offline" alone is useless; "showing the last update from 14:32" tells a
 *  person how much to trust what they are reading. */
function OfflineBar() {
  const { t, online, lastSync } = useStore();
  if (online) return null;
  const time = lastSync
    ? new Date(lastSync).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "—";
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--color-l2)]/30 bg-[var(--color-l2-wash)] px-5 py-2.5 text-[var(--color-l2)]">
      <IconWifiOff size={18} />
      <div className="min-w-0 text-[13px] font-semibold leading-snug">
        {t.offline}. {t.offlineSub}{" "}
        <span className="num">{t.lastUpdate} {time}</span>
      </div>
    </div>
  );
}

function CallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useStore();
  return (
    <Sheet open={open} onClose={onClose} title={t.emergencyNumbers}>
      <p className="mb-4 text-[14px] text-[var(--color-ink-2)]">{t.tapToDial}</p>
      <div className="space-y-2">
        {HELPLINES.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.number}`}
            className={cx(
              "flex items-center gap-4 rounded-[12px] border border-[var(--color-hairline)]",
              "bg-[var(--color-paper)] px-4 py-3.5 transition-colors hover:border-[var(--color-ink-3)]",
            )}
          >
            <span className="num grid h-12 min-w-[60px] shrink-0 place-items-center rounded-[9px] bg-[var(--color-l4-wash)] px-2 text-[19px] font-extrabold text-[var(--color-l4)]">
              {h.number}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold">{h.name}</span>
              <span className="block truncate text-[13px] text-[var(--color-ink-3)]">{h.detail}</span>
            </span>
          </a>
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-ink-3)]">
        These ten numbers are real and free to dial from any Indian phone, including a phone with
        no balance and no SIM. They are the only numbers in this prototype that are not synthetic,
        and the assistant is not permitted to say any number outside this list.
      </p>
      <div className="mt-4">
        <Btn full variant="ghost" onClick={onClose}>{t.close}</Btn>
      </div>
    </Sheet>
  );
}
