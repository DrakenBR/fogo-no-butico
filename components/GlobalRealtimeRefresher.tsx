"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Assina realtime em tabelas chave e refaz router.refresh() ao receber
 * eventos. Cobre badges da sidebar/bottom-nav (notif/chat/curtidas) e
 * mantém qualquer lista renderizada no server atualizada na hora.
 *
 * Debounce de 500ms pra agrupar bursts (ex: usuário escrevendo no chat).
 */
export function GlobalRealtimeRefresher({ meId }: { meId: string }) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const triggerRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => router.refresh(), 500);
    };

    const subs = [
      // Notificações (com filtro pra mim) — pra badge "Notif." e /notificacoes
      supabase
        .channel("global:notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
          triggerRefresh
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
          triggerRefresh
        )
        .subscribe(),

      // Crushes em mim — badge "Curtidas" e /curtidas
      supabase
        .channel("global:crushes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "crushes", filter: `target_id=eq.${meId}` },
          triggerRefresh
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "crushes", filter: `target_id=eq.${meId}` },
          triggerRefresh
        )
        .subscribe(),

      // Mensagens 1-1 (sem filtro porque não tem coluna direta pra mim;
      // backend filtra via RLS no que server lê)
      supabase
        .channel("global:messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, triggerRefresh)
        .subscribe(),

      // Mensagens de grupo — pra badge "Chat" e /chat/g/[id]
      supabase
        .channel("global:group-messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "group_messages" }, triggerRefresh)
        .subscribe(),

      // Sou adicionado/removido de grupo — /chat atualiza
      supabase
        .channel("global:group-members")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "group_members", filter: `user_id=eq.${meId}` },
          triggerRefresh
        )
        .subscribe(),

      // Posts novos no feed (refresh é leve já tem o pill banner)
      // Tickets de match: conversations novas (= novo match)
      supabase
        .channel("global:conversations")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, triggerRefresh)
        .subscribe()
    ];

    return () => {
      subs.forEach((c) => supabase.removeChannel(c));
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [router, meId]);

  return null;
}
