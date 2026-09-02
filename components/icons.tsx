// -----------------------------------------------------------------------------
// ICONS
// -----------------------------------------------------------------------------
// Hand-drawn inline SVG, no icon library and no runtime CDN. Two reasons, and
// the first is the one that matters:
//
//   1. An icon library loaded from a CDN is a network dependency on the one
//      screen that must render when the network is failing. Ad blockers and
//      corporate proxies also routinely eat them, and a warning screen full of
//      empty boxes is worse than one with no icons at all.
//   2. A consistent stroke weight and terminal style across a set drawn for one
//      product reads as designed. A grab-bag from three libraries does not.
//
// House style: 24x24 box, 1.75 stroke, round caps and joins, currentColor,
// no fills, geometry aligned to a half-pixel grid at 24px so edges stay crisp.
// No icon here depicts a human face.
// -----------------------------------------------------------------------------

type P = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  /** Severity colour is a runtime token, so callers need to set it inline. */
  style?: React.CSSProperties;
};

function S({
  size = 24,
  className,
  strokeWidth = 1.75,
  style,
  children,
}: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <S {...p}>
    <path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-6V20H4.5a1 1 0 0 1-1-1z" />
  </S>
);

export const IconAlert = (p: P) => (
  <S {...p}>
    <path d="M12 3.5c-3 0-5.5 2.4-5.5 5.4 0 4.2-1.2 5.9-2 6.7-.4.4-.1 1.1.5 1.1h14c.6 0 .9-.7.5-1.1-.8-.8-2-2.5-2-6.7 0-3-2.5-5.4-5.5-5.4Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </S>
);

export const IconPlan = (p: P) => (
  <S {...p}>
    <path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z" />
    <path d="M15 3.5v4h4" />
    <path d="M9 12h7M9 15.5h5" />
  </S>
);

export const IconFind = (p: P) => (
  <S {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 4.5 4.5" />
  </S>
);

export const IconHelp = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.7-.8 1.2v.4" />
    <path d="M12 16.6h.01" />
  </S>
);

export const IconPin = (p: P) => (
  <S {...p}>
    <path d="M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </S>
);

export const IconPhone = (p: P) => (
  <S {...p}>
    <path d="M6.5 3.8h2.2l1.5 3.6-1.8 1.3a10.5 10.5 0 0 0 5.4 5.4l1.3-1.8 3.6 1.5v2.2a2 2 0 0 1-2.2 2A15.8 15.8 0 0 1 4.5 6a2 2 0 0 1 2-2.2Z" />
  </S>
);

export const IconSpeaker = (p: P) => (
  <S {...p}>
    <path d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3z" />
    <path d="M15 9.2a4 4 0 0 1 0 5.6" />
    <path d="M17.5 6.8a7.5 7.5 0 0 1 0 10.4" />
  </S>
);

export const IconSpeakerOff = (p: P) => (
  <S {...p}>
    <path d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3z" />
    <path d="m15.5 9.5 4 5M19.5 9.5l-4 5" />
  </S>
);

export const IconMic = (p: P) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="10.5" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
    <path d="M12 18v3" />
  </S>
);

export const IconShelter = (p: P) => (
  <S {...p}>
    <path d="M3.5 11 12 4.2 20.5 11" />
    <path d="M5.8 12.8V20h12.4v-7.2" />
    <path d="M10 20v-4.2h4V20" />
  </S>
);

export const IconRoute = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8.2 18h5.3a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h1.3" />
  </S>
);

export const IconGlobe = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.6 12h16.8" />
    <path d="M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
  </S>
);

export const IconMoon = (p: P) => (
  <S {...p}>
    <path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7Z" />
  </S>
);

export const IconSun = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5" />
  </S>
);

export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </S>
);

export const IconClose = (p: P) => (
  <S {...p}>
    <path d="M6 6 18 18M18 6 6 18" />
  </S>
);

export const IconChevron = (p: P) => (
  <S {...p}>
    <path d="m9 5.5 6.5 6.5L9 18.5" />
  </S>
);

export const IconArrowLeft = (p: P) => (
  <S {...p}>
    <path d="M19 12H5.5" />
    <path d="m11 5.5-5.5 6.5L11 18.5" />
  </S>
);

export const IconClock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2V12l3.2 2" />
  </S>
);

export const IconWifiOff = (p: P) => (
  <S {...p}>
    <path d="M2.5 8.5a16 16 0 0 1 5-3.1" />
    <path d="M21.5 8.5a16 16 0 0 0-9-3.4" />
    <path d="M6 12.2a11 11 0 0 1 3-1.8" />
    <path d="M18 12.2a11 11 0 0 0-3.6-2" />
    <path d="M9.5 15.8a6 6 0 0 1 5 0" />
    <path d="M12 19.5h.01" />
    <path d="m3 3 18 18" />
  </S>
);

export const IconShield = (p: P) => (
  <S {...p}>
    <path d="M12 3.2 5 6v5.4c0 4.2 2.9 7.8 7 9.4 4.1-1.6 7-5.2 7-9.4V6z" />
  </S>
);

export const IconWater = (p: P) => (
  <S {...p}>
    <path d="M12 3.5c3.2 3.6 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2.3-5.7 5.5-9.3Z" />
  </S>
);

export const IconWind = (p: P) => (
  <S {...p}>
    <path d="M3.5 8.5h9a2.75 2.75 0 1 0-2.75-2.75" />
    <path d="M3.5 12.5h13a2.75 2.75 0 1 1-2.75 2.75" />
    <path d="M3.5 16.5h6" />
  </S>
);

export const IconQuake = (p: P) => (
  <S {...p}>
    <path d="M2.5 13h3l2-6 3 12 3-9 2 3h6" />
  </S>
);

export const IconHeat = (p: P) => (
  <S {...p}>
    <path d="M10.5 13.8V5.6a1.75 1.75 0 1 1 3.5 0v8.2a3.6 3.6 0 1 1-3.5 0Z" />
  </S>
);

export const IconSlope = (p: P) => (
  <S {...p}>
    <path d="M2.5 19h19" />
    <path d="M3.5 19 11 7l4.5 6.5" />
    <path d="m13.5 16.5 3-4.5 4 7" />
  </S>
);

export const IconFire = (p: P) => (
  <S {...p}>
    <path d="M12 3.5c.6 2.6-1.2 3.7-2.4 5.2A5.5 5.5 0 0 0 8.3 12a3.7 3.7 0 0 0 7.4 0c0-1.3-.6-2.3-1.4-3.4" />
    <path d="M12 20.5a5.5 5.5 0 0 0 5.5-5.5c0-2-1-3.6-2.2-5" />
    <path d="M12 20.5A5.5 5.5 0 0 1 6.5 15" />
  </S>
);

export const IconInfo = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.2M12 7.9h.01" />
  </S>
);

export const IconSend = (p: P) => (
  <S {...p}>
    <path d="m20.5 3.5-8 17-2.5-7-7-2.5z" />
  </S>
);

export const IconShare = (p: P) => (
  <S {...p}>
    <path d="M12 15.5V4" />
    <path d="m8 7.5 4-4 4 4" />
    <path d="M5.5 13v6.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13" />
  </S>
);

export const IconUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
  </S>
);

export const IconBolt = (p: P) => (
  <S {...p}>
    <path d="M13.5 2.5 5 13.5h5.5L10 21.5 19 10h-5.5z" />
  </S>
);

export const IconLayers = (p: P) => (
  <S {...p}>
    <path d="m12 3.5 8.5 4.2L12 12 3.5 7.7z" />
    <path d="m3.5 12.3 8.5 4.2 8.5-4.2" />
    <path d="m3.5 16.6 8.5 4.2 8.5-4.2" />
  </S>
);

export const IconText = (p: P) => (
  <S {...p}>
    <path d="M4 6.5V4.5h16v2" />
    <path d="M12 4.5v15" />
    <path d="M9 19.5h6" />
  </S>
);

/** Hazard glyph lookup, so a hazard type always draws the same mark. */
export const HAZARD_ICON: Record<string, (p: P) => React.ReactElement> = {
  flood: IconWater,
  "urban-flood": IconWater,
  cyclone: IconWind,
  earthquake: IconQuake,
  landslide: IconSlope,
  heatwave: IconHeat,
  thunderstorm: IconBolt,
  drought: IconSun,
  wildfire: IconFire,
  coldwave: IconMoon,
};
