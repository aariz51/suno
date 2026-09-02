"use client";

// -----------------------------------------------------------------------------
// MOTION
// -----------------------------------------------------------------------------
// The motion recipes here are taken from two 21st.dev components — dillionverma's
// Blur Fade (y +6 → -6, opacity 0 → 1, blur 6px → 0, 0.4s ease-out, fired once on
// intersection) and Word Rotate (vertical enter/exit, 0.25s ease-out) — and
// reimplemented on IntersectionObserver and CSS transitions rather than adopted
// wholesale on framer-motion. Two reasons, and the second is not negotiable:
//
//   1. This page's own argument is that the product works on a bad connection.
//      Shipping ~50KB of animation runtime to make that argument prettier would
//      be undermining it in public.
//
//   2. framer-motion's reveal pattern starts every element at opacity: 0 and
//      relies on JavaScript to bring it back. On a page about disaster warnings,
//      content must never be hidden behind a script that might not run. Here the
//      hidden state is applied ONLY after an inline boot script has confirmed JS
//      is alive (:root.js in globals.css). With no JS, nothing animates and
//      everything is simply visible — which is the correct failure mode.
//
// Everything below is inert under prefers-reduced-motion.
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from "react";

type RevealKind = "rise" | "fade" | "scale";

/** Fires once when the element first enters the viewport. */
function useInViewOnce<T extends HTMLElement>(margin = "-64px") {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    // No observer (old browser, or a test environment): show it immediately
    // rather than leaving it hidden forever.
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: margin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, seen]);

  return { ref, seen };
}

export function Reveal({
  children,
  kind = "rise",
  delay = 0,
  as: As = "div",
  className,
}: {
  children: React.ReactNode;
  kind?: RevealKind;
  delay?: number;
  as?: React.ElementType;
  className?: string;
}) {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  return (
    <As
      ref={ref}
      data-reveal={kind}
      data-in={seen ? "" : undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={className}
    >
      {children}
    </As>
  );
}

/** Reveals its children one after another. The stagger is the point: a list that
 *  arrives all at once reads as a block, one that arrives in sequence reads as a
 *  sequence — which for ordered emergency instructions is the truer shape. */
export function RevealGroup({
  children,
  step = 70,
  start = 0,
  kind = "rise",
  className,
}: {
  children: React.ReactNode;
  step?: number;
  start?: number;
  kind?: RevealKind;
  className?: string;
}) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} kind={kind} delay={start + i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------

/** Counts up to a value when it first scrolls into view.
 *
 *  Set in tabular figures by the caller, so the digits do not reflow as they
 *  change — the same reason the live countdown inside the app uses them. */
export function CountUp({
  to,
  duration = 900,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const { ref, seen } = useInViewOnce<HTMLSpanElement>();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!seen) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || to === 0) {
      setN(to);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    // easeOutCubic: fast start, settles rather than stops. A linear count reads
    // like a loading spinner; this reads like a value arriving.
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(ease(p) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);

  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}

// -----------------------------------------------------------------------------

/** Cycles a word vertically. Used in the hero for the word "warning" in each of
 *  the thirteen languages: the page's whole claim, performed rather than stated.
 *
 *  The list is rendered into the DOM as a visually-hidden sentence so a screen
 *  reader and a crawler get all thirteen at once instead of whichever happened
 *  to be showing. */
export function RotatingWord({
  items,
  interval = 2100,
  className,
}: {
  items: { word: string; label: string; lang: string; dir?: "ltr" | "rtl" }[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || paused || items.length < 2) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % items.length), interval);
    return () => window.clearInterval(id);
  }, [items.length, interval, paused]);

  const cur = items[i];

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="sr-only">
        The word for &ldquo;warning&rdquo; in {items.map((x) => x.label).join(", ")}.
      </span>

      <span aria-hidden className="flex items-baseline gap-3">
        <span className="relative block h-[1.25em] min-w-[6ch] overflow-hidden">
          <span
            key={i}
            lang={cur.lang}
            dir={cur.dir ?? "ltr"}
            className="a-rotate-in block whitespace-nowrap"
          >
            {cur.word}
          </span>
        </span>
        <span className="text-[13px] font-semibold text-[var(--color-ink-3)]">{cur.label}</span>
      </span>
    </div>
  );
}
