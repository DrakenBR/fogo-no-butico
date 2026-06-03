"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Recalcula badges do usuário logado no mount. */
export function BadgeRefresher() {
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("recompute_my_badges").then(() => {});
  }, []);
  return null;
}
