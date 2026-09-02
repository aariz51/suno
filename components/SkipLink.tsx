"use client";

// A skip link is an accessibility affordance for exactly the people this product
// is built for — screen-reader and keyboard users. Leaving it in English in a
// thirteen-language app would be the same failure the product exists to fix,
// one element wide.

import { useStore } from "./store";

export function SkipLink() {
  const { t } = useStore();
  return (
    <a href="#main" className="sr-only skip">
      {t.skipToWarning}
    </a>
  );
}
