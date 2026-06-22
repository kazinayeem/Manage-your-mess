"use client";

import { useState, useEffect, useCallback } from "react";

/** Locks body scroll when mobile sidebar is open — fixes Safari/iOS scroll bleed. */
export function useMobileSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const htmlStyle = document.documentElement.style;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";
    htmlStyle.overflow = "hidden";

    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      style.overflow = "";
      htmlStyle.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return { open, setOpen, close, toggle };
}
