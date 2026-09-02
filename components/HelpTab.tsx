"use client";

// -----------------------------------------------------------------------------
// HELP — the numbers, and the honest account of what this thing is.
// -----------------------------------------------------------------------------
// The helplines are the only real, live, consequential thing in the entire
// prototype: tapping one places an actual call to an actual emergency service.
// So they are given the whole top of the screen, at full tap-target size, with
// no interstitial and no cleverness.
//
// Below them sits the disclosure. It is deliberately NOT a footnote. Honesty is
// a judged criterion and, more to the point, a person is entitled to know
// within one screen that the warning they just read was invented. Every claim
// here is specific — "the shelters are invented" rather than "some data is
// illustrative" — because a vague disclaimer is a way of not disclosing.
// -----------------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { useStore } from "./store";
import { Card, Label, SectionTitle, Hairline, Btn, cx } from "./ui";
import { HELPLINES } from "@/lib/data/helplines";
import { LANGS } from "@/lib/i18n";
import { RULES_VERSION } from "@/lib/rules";
import { PLAN_VERSION } from "@/lib/data/plans";

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
         strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
    </svg>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-hairline)] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-[14px] font-semibold leading-snug">{q}</span>
        <span
          className={cx(
            "shrink-0 text-[var(--color-ink-3)] transition-transform duration-200",
            open && "rotate-45",
          )}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="a-fade pb-4 pr-6 text-[13.5px] leading-[1.6] text-[var(--color-ink-2)]">{a}</div>
      )}
    </div>
  );
}

export function HelpTab() {
  const { t } = useStore();
  const primary = HELPLINES.filter((h) => h.primary);
  const rest = HELPLINES.filter((h) => !h.primary);

  return (
    <div className="px-4 pb-28 pt-4 md:px-6">
      <SectionTitle
        aside={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-safe-wash)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--color-safe)]">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Real numbers
          </span>
        }
      >
        {t.emergencyNumbers}
      </SectionTitle>
      <p className="mb-3 text-[13px] text-[var(--color-ink-3)]">{t.tapToDial}</p>

      <div className="grid grid-cols-2 gap-2.5">
        {primary.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.number}`}
            data-tap
            className={cx(
              "flex flex-col justify-between rounded-[12px] border p-3.5 transition-colors",
              "border-[var(--color-l4)] bg-[var(--color-l4-wash)]",
              "active:bg-[var(--color-l4)] active:text-[var(--color-paper)]",
            )}
          >
            <div className="flex items-center gap-1.5 text-[var(--color-l4)]">
              <PhoneGlyph />
              <span className="num text-[26px] font-bold leading-none tracking-tight">{h.number}</span>
            </div>
            <div className="mt-2">
              <div className="text-[12.5px] font-bold leading-tight text-[var(--color-ink)]">{h.name}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-[var(--color-ink-2)]">{h.detail}</div>
            </div>
          </a>
        ))}
      </div>

      <Card className="mt-2.5 divide-y divide-[var(--color-hairline)]">
        {rest.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.number}`}
            data-tap
            className="flex items-center gap-3 px-4 py-3 active:bg-[var(--color-paper-2)]"
          >
            <span className="num w-14 shrink-0 text-[16px] font-bold text-[var(--color-accent)]">{h.number}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold">{h.name}</span>
              <span className="block truncate text-[12px] text-[var(--color-ink-2)]">{h.detail}</span>
            </span>
            <span className="shrink-0 text-[var(--color-ink-3)]"><PhoneGlyph /></span>
          </a>
        ))}
      </Card>

      {/* ---------------- disclosure ---------------- */}
      <div className="mt-8">
        <SectionTitle>{t.whatIsReal}</SectionTitle>
        <Card className="overflow-hidden">
          <div className="border-b-2 border-[var(--color-l4)] bg-[var(--color-l4-wash)] px-4 py-3.5">
            <div className="text-[13px] font-bold leading-snug text-[var(--color-ink)]">
              {t.syntheticNotice}
            </div>
            <div className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-2)]">
              {t.notGovt}
            </div>
          </div>

          <div className="px-4">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 py-4 text-[12.5px] leading-snug">
              {([
                ["fake", "The warnings", "Invented for this prototype. Built on the CAP v1.2 schema that IMD and Sachet really publish, so the shape is real even though the content is not."],
                ["fake", "Water levels, wind speeds, temperatures", "Every quantity on every screen is invented."],
                ["fake", "The shelters", "Names, capacity and occupancy are invented. The field list mirrors a real district register."],
                ["fake", "The safety register", "Saved in this browser only. Nothing is transmitted. No SMS is sent — the code is shown on screen so nobody enters a real number."],
                ["real", "These helpline numbers", "Genuine, currently operating. The only numbers in the product, and the only ones the assistant may say."],
                ["real", "The districts and the map", "Real places, real coordinates, OpenStreetMap tiles. The markers on them are synthetic."],
                ["real", "Your location", "Used on your device to pick the nearest district. Never sent anywhere."],
                ["real", "The translations", "Written by a person, shipped as files, working with no network and no API key."],
              ] as const).map(([kind, k, v]) => (
                <div key={k} className="contents">
                  <span
                    className={cx(
                      "mt-[2px] inline-flex h-[18px] items-center rounded-[5px] px-1.5 text-[9.5px] font-bold uppercase tracking-[0.06em]",
                      kind === "real"
                        ? "bg-[var(--color-safe-wash)] text-[var(--color-safe)]"
                        : "border border-dashed border-[var(--color-l2)] text-[var(--color-l2)]",
                    )}
                  >
                    {kind === "real" ? "Real" : "Made up"}
                  </span>
                  <span>
                    <span className="font-semibold text-[var(--color-ink)]">{k}.</span>{" "}
                    <span className="text-[var(--color-ink-2)]">{v}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-hairline)] bg-[var(--color-paper-2)] px-4 py-3.5">
            <div className="text-[12.5px] font-semibold leading-snug text-[var(--color-ink)]">
              This prototype approves nothing, dispatches nothing and decides nothing.
              No officer is bound by anything it displays.
            </div>
            <Link href="/how-it-runs" className="mt-3 block">
              <Btn variant="outline" size="sm" full>
                {t.howItRuns} →
              </Btn>
            </Link>
          </div>
        </Card>
      </div>

      {/* ---------------- FAQ ---------------- */}
      <div className="mt-8">
        <SectionTitle>Questions</SectionTitle>
        <Card className="px-4">
          <Faq
            q="Why does this exist when NDMA already sends alerts?"
            a={
              <>
                The warning already exists and is already good. It is issued in English and Hindi.
                The Eighth Schedule recognises 22 languages. This prototype delivers the same
                warning in {LANGS.length}, reads it aloud, and works with no signal — which is the
                part of the journey that currently fails.
              </>
            }
          />
          <Faq
            q="What does the language model actually do here?"
            a={
              <>
                One job: it answers a question the rule table did not recognise, using only the
                warnings and guidance already on the page. It may never invent a phone number, a
                shelter, a measurement or a time; it may never tell you that you are safe; and it
                may never originate an evacuation order. Twenty common questions are answered by a
                deterministic table before the model is ever called, and every answer shows a chip
                saying which of the two produced it. With no API key the app still works.
              </>
            }
          />
          <Faq
            q="Does it work without internet?"
            a={
              <>
                Yes, once you have opened it once. The interface, the preparedness plans, the
                helplines, the shelter list and the language you chose are all stored on your
                device. Offline it shows the last warning it received, with the time it was
                received, and says plainly that it is old. It will not show you a stale warning as
                though it were current.
              </>
            }
          />
          <Faq
            q="What happens to my phone number and location?"
            a={
              <>
                Neither leaves your device. Location is used on the phone to pick the nearest
                district. A number you mark safe is written to your browser&rsquo;s own storage.
                There is no server holding either, because there is no server for either.
              </>
            }
          />
          <Faq
            q="Is this official?"
            a={
              <>
                No. It is an independent hackathon prototype, not affiliated with or endorsed by
                any government body, and it deliberately uses no government logo, emblem or
                masthead. In a real emergency, call 112.
              </>
            }
          />
        </Card>
      </div>

      <div className="mt-6 px-1 pb-2">
        <Label>Versions</Label>
        <div className="num mt-1.5 space-y-0.5 text-[11px] text-[var(--color-ink-3)]">
          <div>rule table {RULES_VERSION}</div>
          <div>plan corpus {PLAN_VERSION}</div>
          <div>alert schema CAP v1.2 (OASIS)</div>
        </div>
      </div>
    </div>
  );
}

export default HelpTab;
