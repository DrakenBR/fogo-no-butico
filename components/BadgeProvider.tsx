"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface BadgeCounts {
  notifs: number;
  messages: number;
  crushers: number;
}

const BadgeContext = createContext<BadgeCounts | null>(null);

/** Lê os counts ao vivo. Retorna null se fora do provider (fallback p/ props). */
export function useBadges(): BadgeCounts | null {
  return useContext(BadgeContext);
}

/**
 * Mantém os badges (notif / chat / curtidas) ao vivo SEM full-refresh por
 * mensagem. Em cada evento relevante refaz só a RPC de contagem (barata,
 * debounced) e atualiza o estado. Só chama router.refresh() quando o usuário
 * está na página-lista correspondente (refresh cirúrgico).
 */
export function BadgeProvider({
  meId,
  initial,
  children
}: {
  meId: string;
  initial: BadgeCounts;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const [counts, setCounts] = useState<BadgeCounts>(initial);

  // re-seed se o servidor mandar counts novos (ex: navegação)
  useEffect(() => {
    setCounts(initial);
  }, [initial.notifs, initial.messages, initial.crushers]);

  // timers de debounce por tipo
  const timers = useRef<{ chat?: ReturnType<typeof setTimeout>; notif?: ReturnType<typeof setTimeout>; crush?: ReturnType<typeof setTimeout> }>({});
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const surgicalRefresh = (prefix: string) => {
      if (!pathRef.current?.startsWith(prefix)) return;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 600);
    };

    const bumpChat = () => {
      if (timers.current.chat) clearTimeout(timers.current.chat);
      timers.current.chat = setTimeout(async () => {
        const { data } = await supabase.rpc("unread_chat_count_total");
        if (typeof data === "number") setCounts((c) => ({ ...c, messages: data }));
      }, 800);
      surgicalRefresh("/chat");
    };

    const bumpNotif = () => {
      if (timers.current.notif) clearTimeout(timers.current.notif);
      timers.current.notif = setTimeout(async () => {
        const { data } = await supabase.rpc("unread_notifications_count");
        if (typeof data === "number") setCounts((c) => ({ ...c, notifs: data }));
      }, 600);
      surgicalRefresh("/notificacoes");
    };

    const bumpCrush = () => {
      if (timers.current.crush) clearTimeout(timers.current.crush);
      timers.current.crush = setTimeout(async () => {
        const { data } = await supabase.rpc("unrevealed_crushers_count");
        if (typeof data === "number") setCounts((c) => ({ ...c, crushers: data }));
      }, 600);
      surgicalRefresh("/curtidas");
    };

    const subs = [
      // Chat: 1-1 + grupos. Handler barato (contagem), nunca refresh por msg.
      supabase
        .channel("badge:messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, bumpChat)
        .subscribe(),
      supabase
        .channel("badge:group-messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "group_messages" }, bumpChat)
        .subscribe(),
      // Entrei/saí de grupo (filtrado por mim) — atualiza chat + lista /chat
      supabase
        .channel("badge:group-members")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "group_members", filter: `user_id=eq.${meId}` },
          bumpChat
        )
        .subscribe(),
      // Notificações pra mim (filtrado)
      supabase
        .channel("badge:notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
          bumpNotif
        )
        .subscribe(),
      // Crushes em mim (filtrado)
      supabase
        .channel("badge:crushes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "crushes", filter: `target_id=eq.${meId}` },
          () => {
            bumpCrush();
            // novo match pode aparecer na /chat também
            if (pathRef.current?.startsWith("/chat")) surgicalRefresh("/chat");
          }
        )
        .subscribe()
    ];

    return () => {
      subs.forEach((c) => supabase.removeChannel(c));
      Object.values(timers.current).forEach((t) => t && clearTimeout(t));
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [meId, router]);

  return <BadgeContext.Provider value={counts}>{children}</BadgeContext.Provider>;
}
