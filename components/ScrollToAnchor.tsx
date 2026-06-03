"use client";

import { useEffect } from "react";

export function ScrollToAnchor({ id }: { id: string }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
    }
  }, [id]);
  return null;
}
