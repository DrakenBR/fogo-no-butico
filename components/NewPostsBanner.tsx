"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Pílula sticky no topo do feed. Recebe INSERTs em `posts` via realtime
 * e mostra um contador. Ao clicar, refresha o feed pra buscar os novos.
 */
export function NewPostsBanner({ excludeUserId }: { excludeUserId: string | null }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:new-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const row = payload.new as { user_id?: string };
          if (excludeUserId && row.user_id === excludeUserId) return;
          setCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [excludeUserId]);

  if (count === 0) return null;

  const refresh = () => {
    start(() => {
      router.refresh();
      setCount(0);
    });
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 14,
        zIndex: 9,
        display: "flex",
        justifyContent: "center",
        margin: "10px 0 0",
        pointerEvents: "none"
      }}
    >
      <button
        onClick={refresh}
        disabled={pending}
        className="fire-bg"
        style={{
          color: "#fff",
          border: "none",
          padding: "8px 18px",
          borderRadius: 999,
          fontSize: 13.5,
          fontWeight: 700,
          cursor: pending ? "wait" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 8px 24px rgba(255,27,107,.4)",
          pointerEvents: "auto"
        }}
      >
        <Flame size={14} fill="#fff" />
        {pending ? "atualizando..." : `${count} ${count === 1 ? "novo post" : "novos posts"}`}
      </button>
    </div>
  );
}
