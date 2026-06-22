"use client";

import { useEffect } from "react";

/** Syncs locale onto <html> so Bengali fonts and lang work in Safari (child wrappers don't reach body). */
export function LocaleHtmlAttrs({ locale }: { locale: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.classList.toggle("locale-bn", locale === "bn");
    return () => {
      root.classList.remove("locale-bn");
    };
  }, [locale]);

  return null;
}
