"use client";

// -----------------------------------------------------------------------------
// BOOT
// -----------------------------------------------------------------------------
// Three side effects that have to happen once, after the store exists:
//
//   1. Register the service worker. This is what makes the app open at all when
//      the tower is down, which for a disaster product is not a nice-to-have.
//   2. Load the webfont for the CURRENT SCRIPT ONLY. A twelve-script Noto
//      superfamily is several hundred kilobytes; one script is a few tens. On
//      the 2G connection this build is designed for, that difference is the
//      difference between reading the warning and watching a spinner.
//   3. Set <html lang> and dir so screen readers and Urdu render correctly.
//
// It renders nothing.
// -----------------------------------------------------------------------------

import { useEffect } from "react";
import { useStore } from "./store";
import { LANG_BY_CODE } from "@/lib/i18n";

export function Boot() {
  const { lang } = useStore();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Registered after load so it never competes with the first paint of a
    // warning for bandwidth.
    const reg = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") reg();
    else {
      window.addEventListener("load", reg, { once: true });
      return () => window.removeEventListener("load", reg);
    }
  }, []);

  useEffect(() => {
    const meta = LANG_BY_CODE[lang];
    if (!meta) return;

    const root = document.documentElement;
    root.lang = lang;
    root.dir = meta.dir;
    root.setAttribute("data-script", meta.script);

    if (!meta.font) return;
    const id = `font-${meta.script}`;
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${meta.font.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [lang]);

  return null;
}
