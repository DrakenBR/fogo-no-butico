"use client";

import { useEffect } from "react";

/**
 * Aplica o tema (dark/light) no <html>. Lê primeiro do localStorage
 * (pra não dar flash) e mantém em sync. Usado no AppShell.
 */
export function ThemeApplier({ initial }: { initial: "dark" | "light" }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark" ? stored : initial;
    document.documentElement.dataset.theme = theme;
    if (theme !== stored) localStorage.setItem("theme", theme);
  }, [initial]);
  return null;
}
