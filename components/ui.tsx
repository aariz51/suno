"use client";

// -----------------------------------------------------------------------------
// PRIMITIVES
// -----------------------------------------------------------------------------
// Small, opinionated, and shared, so that every surface in the app has the same
// corner radius, the same hairline, the same touch target and the same idea of
// what a label looks like. Consistency at this level is most of what separates
// a designed interface from an assembled one.
// -----------------------------------------------------------------------------

import React from "react";
import { IconClose } from "./icons";

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

/** Level -> token name. Keeps severity colour in exactly one place. */
export function levelTone(lv: 1 | 2 | 3 | 4) {
  return ({ 1: "l1", 2: "l2", 3: "l3", 4: "l4" } as const)[lv];
}

// -----------------------------------------------------------------------------

export function Card({
  children, className, as: As = "div", ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <As
      className={cx(
        "rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-paper)]",
        "shadow-[var(--shadow-card)]",
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

/** A small uppercase label. Used for every section heading and every metadata
 *  key in the product, so the eye learns one shape for "this is a label". */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-ink-3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children, aside, className,
}: { children: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("mb-3 flex items-baseline justify-between gap-3", className)}>
      <h2 className="text-[17px] font-bold leading-tight tracking-[-0.01em]">{children}</h2>
      {aside}
    </div>
  );
}

export function Chip({
  children, active, tone, onClick, count, ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  tone?: string;
  count?: number;
  onClick?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const El = onClick ? "button" : "span";
  return (
    <El
      onClick={onClick}
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5",
        "text-[13px] font-semibold transition-colors",
        active
          ? "border-transparent bg-[var(--color-ink)] text-[var(--color-paper)]"
          : "border-[var(--color-hairline)] bg-[var(--color-paper)] text-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]",
        onClick && "cursor-pointer",
      )}
      style={tone && !active ? { color: `var(--color-${tone})`, borderColor: `var(--color-${tone})` } : undefined}
      {...(rest as Record<string, unknown>)}
    >
      {children}
      {count !== undefined && (
        <span className={cx("num text-[12px]", active ? "opacity-70" : "text-[var(--color-ink-3)]")}>
          {count}
        </span>
      )}
    </El>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "safe";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  icon?: React.ReactNode;
};

export function Btn({
  children, variant = "outline", size = "md", full, icon, className, ...rest
}: BtnProps) {
  const sizes = {
    sm: "h-9 px-3 text-[13px] gap-1.5 rounded-[8px]",
    md: "h-11 px-4 text-[15px] gap-2 rounded-[10px]",
    lg: "h-14 px-5 text-[17px] gap-2.5 rounded-[12px]",
  }[size];

  const variants = {
    primary: "bg-[var(--color-accent)] text-white border-transparent hover:brightness-110",
    danger: "bg-[var(--color-l4)] text-white border-transparent hover:brightness-110",
    safe: "bg-[var(--color-safe)] text-white border-transparent hover:brightness-110",
    outline:
      "bg-[var(--color-paper)] text-[var(--color-ink)] border-[var(--color-hairline)] shadow-[0_1px_2px_rgb(18_22_28/0.04)] hover:border-[var(--color-ink-3)]",
    ghost: "bg-transparent text-[var(--color-ink-2)] border-transparent hover:bg-[var(--color-paper-2)]",
  }[variant];

  return (
    <button
      className={cx(
        "inline-flex shrink-0 items-center justify-center border font-semibold",
        // Named properties, never `transition: all`. 140ms sits in the 100-160ms
        // band for a button press.
        "transition-[filter,border-color,background-color,transform] duration-[140ms]",
        "[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        // shadcn's defensive icon rules: an SVG inside a button should never
        // swallow the click or get squashed by flex.
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        sizes, variants, full && "w-full", className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/** A bottom sheet on mobile, a centred panel on desktop. Used for every modal
 *  surface, so there is exactly one dismissal gesture to learn. */
export function Sheet({
  open, onClose, title, children, labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus moves into the sheet, so a keyboard or screen-reader user is not
    // left behind the overlay.
    window.setTimeout(() => ref.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={labelledBy ? undefined : title}
      aria-labelledby={labelledBy}
    >
      <div
        className="absolute inset-0 bg-[rgb(10_13_18/0.45)] backdrop-blur-[2px] a-fade"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={cx(
          "relative w-full max-w-[560px] outline-none",
          "max-h-[88vh] overflow-y-auto overscroll-contain",
          "rounded-t-[18px] sm:rounded-[16px] sm:mx-4",
          "border border-[var(--color-hairline)] bg-[var(--color-paper)]",
          "shadow-[var(--shadow-lift)] a-sheet",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-hairline)] bg-[var(--color-paper)] px-5 py-3.5">
          <h2 className="text-[16px] font-bold tracking-[-0.01em]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
          >
            <IconClose size={20} />
          </button>
        </div>
        <div className="px-5 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label, hint, error, children, id,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-[var(--color-ink-2)]">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] font-semibold text-[var(--color-l4)]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[var(--color-ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputCls = cx(
  "w-full rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-paper)]",
  "px-3.5 py-3 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]",
  "focus:border-[var(--color-accent)] focus:outline-none",
);

/** Severity band. The one element in the product allowed to shout. */
export function LevelBand({ lv, band, className }: { lv: 1 | 2 | 3 | 4; band: string; className?: string }) {
  const tone = levelTone(lv);
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1",
        "text-[11px] font-extrabold uppercase tracking-[0.1em] text-white",
        className,
      )}
      style={{ background: `var(--color-${tone})` }}
    >
      <span className="num opacity-80">L{lv}</span>
      <span aria-hidden className="h-3 w-px bg-white/35" />
      {band}
    </div>
  );
}

/** The pattern used everywhere a fact has a name and a value. */
export function Stat({
  k, v, sub, mono = true,
}: { k: string; v: string; sub?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <Label>{k}</Label>
      <div className={cx("mt-0.5 truncate text-[15px] font-bold", mono && "num")}>{v}</div>
      {sub && <div className="truncate text-[12px] text-[var(--color-ink-3)]">{sub}</div>}
    </div>
  );
}

/** Disclosure marker. Wherever this appears, the data behind it is synthetic.
 *  One consistent mark, used without exception, is worth more than a paragraph
 *  of disclaimer nobody reads. */
export function SampleMark({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-[5px] border border-dashed border-[var(--color-ink-3)]",
        "px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--color-ink-3)]",
        className,
      )}
      title="Synthetic sample data. Not from any government system."
    >
      {label ?? "Sample"}
    </span>
  );
}

export function Hairline({ className }: { className?: string }) {
  return <div className={cx("h-px w-full bg-[var(--color-hairline)]", className)} />;
}

/** Horizontally scrolling row of chips, with the scrollbar suppressed and
 *  padding that lets the last chip clear the screen edge. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-bar -mx-5 overflow-x-auto px-5">
      <div className="flex w-max gap-2 pb-1">{children}</div>
    </div>
  );
}
