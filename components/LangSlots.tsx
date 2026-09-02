"use client";

// -----------------------------------------------------------------------------
// THE LANGUAGE SLOTS
// -----------------------------------------------------------------------------
// The best animation opportunity on the whole site, because here the motion is
// the argument rather than decoration on top of it.
//
// CAP v1.2 gives every alert a repeating <info> block, one per language. The
// bulletin fills two of them. So on scroll the two filled slots arrive first and
// land solid; the eleven empty ones follow, one at a time, and then sit there
// breathing faintly. A reader watches two things get filled and eleven not, and
// has understood the product before reading a word of the paragraph beside it.
//
// Inert under prefers-reduced-motion, where all thirteen simply appear.
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";
import { LANGS } from "@/lib/i18n";
import { UPSTREAM_LANGUAGES } from "@/lib/data/alerts";

export function LangSlots() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(0);

  const filled = LANGS.filter((l) => (UPSTREAM_LANGUAGES as readonly string[]).includes(l.code));
  const empty = LANGS.filter((l) => !(UPSTREAM_LANGUAGES as readonly string[]).includes(l.code));
  // Filled first, deliberately: the sequence should read "two, then the rest".
  const ordered = [...filled, ...empty];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduced || typeof IntersectionObserver === "undefined") {
        setShown(ordered.length);
        return;
      }
      let n = 0;
      const id = window.setInterval(() => {
        n += 1;
        setShown(n);
        if (n >= ordered.length) window.clearInterval(id);
      }, 85);
    };

    if (typeof IntersectionObserver === "undefined") {
      setShown(ordered.length);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal();
            io.disconnect();
          }
        }
      },
      { rootMargin: "-40px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ordered.length]);

  return (
    <div ref={ref}>
      <div className="flex flex-wrap gap-2" aria-hidden>
        {ordered.map((l, i) => {
          const isFilled = i < filled.length;
          const on = i < shown;
          return (
            <span
              key={l.code}
              title={`${l.english}: ${isFilled ? "in the bulletin" : "empty"}`}
              className={[
                "flex h-11 min-w-[54px] items-center justify-center rounded-[8px] px-2.5",
                "text-[12.5px] font-extrabold uppercase",
                "transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                !isFilled && on ? "a-slot-empty" : "",
              ].join(" ")}
              style={{
                opacity: on ? 1 : 0,
                transform: on ? "none" : "translateY(8px) scale(0.94)",
                ...(isFilled
                  ? { background: "var(--color-ink)", color: "var(--color-paper)" }
                  : { border: "1.5px dashed var(--color-ink-3)", color: "var(--color-ink-3)" }),
              }}
            >
              {l.code}
            </span>
          );
        })}
      </div>

      {/* The same fact, without motion, for anyone who cannot see the sequence. */}
      <p className="sr-only">
        The alert format carries one block per language. The bulletin fills{" "}
        {filled.map((l) => l.english).join(" and ")}. The remaining {empty.length} —{" "}
        {empty.map((l) => l.english).join(", ")} — are left empty.
      </p>
    </div>
  );
}
