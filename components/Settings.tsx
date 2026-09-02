"use client";

// -----------------------------------------------------------------------------
// SETTINGS + LANGUAGE
// -----------------------------------------------------------------------------
// The language picker is the most important control in this product, so it is
// built with more care than a settings menu usually gets:
//
//   - Every language is written IN THAT LANGUAGE. A person who cannot read
//     English cannot find "Assamese" in an English list.
//   - The list is ordered by number of speakers, not alphabetically, so the
//     languages most people are excluded in are at the top.
//   - Each row states plainly whether the upstream bulletin exists in that
//     language. Two rows say "issued by IMD in this language". Eleven do not.
//     That contrast IS the product's argument, put in the place a person will
//     actually look at it.
// -----------------------------------------------------------------------------

import React from "react";
import { useStore } from "./store";
import { Btn, Sheet, cx, Label } from "./ui";
import { IconCheck, IconGlobe, IconMoon, IconSun, IconText } from "./icons";
import { LANGS } from "@/lib/i18n";
import { UPSTREAM_LANGUAGES } from "@/lib/data/alerts";
import type { FontSize } from "./store";

const SIZES: { id: FontSize; label: string; px: number }[] = [
  { id: "s", label: "A", px: 13 },
  { id: "m", label: "A", px: 15 },
  { id: "l", label: "A", px: 18 },
  { id: "xl", label: "A", px: 22 },
];

export function SettingsRow({ onLanguage }: { onLanguage: () => void }) {
  const { t, theme, toggleTheme, fontSize, setFontSize, lang } = useStore();
  const meta = LANGS.find((l) => l.code === lang);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div
        className="flex items-center rounded-full border border-[var(--color-hairline)] p-0.5"
        role="group"
        aria-label={t.textSize}
      >
        {SIZES.map((sz) => (
          <button
            key={sz.id}
            onClick={() => setFontSize(sz.id)}
            aria-pressed={fontSize === sz.id}
            aria-label={`${t.textSize} ${sz.id}`}
            style={{ fontSize: sz.px }}
            className={cx(
              "grid h-8 w-8 place-items-center rounded-full font-bold leading-none transition-colors",
              fontSize === sz.id
                ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "text-[var(--color-ink-3)] hover:text-[var(--color-ink)]",
            )}
          >
            {sz.label}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t.light : t.dark}
        className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-hairline)] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        {theme === "dark" ? <IconSun size={19} /> : <IconMoon size={19} />}
      </button>

      <button
        onClick={onLanguage}
        className="flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-3 text-[13px] font-bold text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <IconGlobe size={17} />
        <span className="max-w-[74px] truncate">{meta?.native ?? "English"}</span>
      </button>
    </div>
  );
}

export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang, districtId } = useStore();
  const upstream = new Set<string>(UPSTREAM_LANGUAGES);

  return (
    <Sheet open={open} onClose={onClose} title={t.chooseLanguage}>
      <div className="mb-4 rounded-[12px] border border-[var(--color-l3)]/25 bg-[var(--color-l3-wash)] p-3.5">
        <div className="text-[14px] font-bold text-[var(--color-l3)]">{t.langGapTitle}</div>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{t.langGapBody}</p>
      </div>

      <div className="space-y-1.5">
        {LANGS.map((l) => {
          const active = l.code === lang;
          const inUpstream = upstream.has(l.code);
          return (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); onClose(); }}
              lang={l.code}
              dir={l.dir}
              className={cx(
                "flex w-full items-center gap-3 rounded-[11px] border px-3.5 py-3 text-left transition-colors",
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-paper-2)]"
                  : "border-[var(--color-hairline)] hover:border-[var(--color-ink-3)]",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-bold leading-tight">{l.native}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--color-ink-3)]">
                  <span>{l.english}</span>
                  <span aria-hidden>·</span>
                  <span className="num">{l.speakersM}M speakers</span>
                </span>
              </span>
              <span
                className={cx(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
                  inUpstream
                    ? "bg-[var(--color-safe-wash)] text-[var(--color-safe)]"
                    : "bg-[var(--color-l3-wash)] text-[var(--color-l3)]",
                )}
              >
                {inUpstream ? "In bulletin" : "Added here"}
              </span>
              {active && <IconCheck size={20} className="shrink-0 text-[var(--color-ink)]" />}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-[var(--color-hairline)] pt-4">
        <Label>How this works</Label>
        <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
          The interface text in all 13 languages is written by hand and shipped as static files, so
          it is identical every time and available with no network. Only one script&apos;s font is
          downloaded — the one you chose — rather than a thirteen-script family.
        </p>
        <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
          The warning text itself is different: in a real deployment it arrives from the feed in
          English and Hindi minutes before it matters, so it is translated at request time by a
          language model and cached. Anything model-translated is marked on screen, and a
          translation that changes a helpline number or the number of lines is discarded rather
          than shown.
        </p>
        <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
          Choosing a district also sets the language to the one most people there read — currently{" "}
          <span className="font-semibold text-[var(--color-ink-2)]">{districtId}</span>. Picking a
          language yourself overrides that from then on.
        </p>
      </div>

      <div className="mt-4">
        <Btn full variant="ghost" onClick={onClose} icon={<IconText size={17} />}>{t.close}</Btn>
      </div>
    </Sheet>
  );
}
