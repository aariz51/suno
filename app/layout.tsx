import type { Metadata, Viewport } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { Boot } from "@/components/boot";
import { SkipLink } from "@/components/SkipLink";

// Latin UI face. Chosen over the default system stack because it has real
// character at large sizes — this product renders 56px headlines that have to
// carry a warning — and over Inter because Inter is the house face of every
// generated interface on the internet.
const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Data face. Every number in this product — time to impact, water level,
// distance, capacity — is set in this, with tabular figures, so a countdown
// does not jitter as it decrements.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  // Deliberately NOT "NDMA" or any ministry name. This prototype must not be
  // mistakable for a government product — that is an explicit rule of the
  // brief and, for the State Emblem, a matter of statute.
  title: "Suno — the warning, in your language",
  description:
    "An independent prototype. India issues disaster warnings in 2 languages. Suno delivers the same warning in 13, out loud, and works with no network. Not a government service.",
  applicationName: "Suno",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Suno" },
  formatDetection: { telephone: true },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Suno — the warning, in your language",
    description:
      "India issues disaster warnings in 2 languages. Suno delivers them in 13, out loud, offline. Independent hackathon prototype.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom is NOT disabled. Disabling it on a product built for people with poor
  // eyesight would undo the entire accessibility argument.
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Theme and text size are applied before first paint. Without this the
            page flashes light before switching to the reader's saved dark mode,
            which on a phone at night is genuinely unpleasant and, on a warning
            screen, briefly illegible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var r=document.documentElement;
r.classList.add('js');
var t=localStorage.getItem('suno.theme');if(t==='dark'||t==='light')r.setAttribute('data-theme',t);
var f=localStorage.getItem('suno.fs');if(f)r.setAttribute('data-fs',f);
}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <StoreProvider>
          <SkipLink />
          <Boot />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
