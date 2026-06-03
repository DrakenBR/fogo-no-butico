"use client";

import { Flame } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  postId: string;
  initialFires: number;
  initialLit: boolean;
  meId: string | null;
}

export function FireButton({ postId, initialFires, initialLit, meId }: Props) {
  const [fires, setFires] = useState(initialFires);
  const [lit, setLit] = useState(initialLit);
  const [pending, start] = useTransition();
  const [bumping, setBumping] = useState(false);

  // realtime: escuta INSERT/DELETE de reactions desse post e ajusta o contador
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:post-fires:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.new as { user_id?: string };
          if (row.user_id === meId) return; // já contei via optimistic
          setFires((f) => f + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions", filter: `post_id=eq.${postId}` },
        (payload) => {
          const row = payload.old as { user_id?: string };
          if (row.user_id === meId) return;
          setFires((f) => Math.max(0, f - 1));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, meId]);

  const toggle = () => {
    if (!meId || pending) return;
    const nextLit = !lit;
    setLit(nextLit);
    setFires((f) => f + (nextLit ? 1 : -1));
    setBumping(true);
    setTimeout(() => setBumping(false), 400);

    start(async () => {
      const supabase = createClient();
      if (nextLit) {
        const { error } = await supabase
          .from("reactions")
          .insert({ post_id: postId, user_id: meId, type: "fire" });
        if (error && error.code !== "23505") {
          setLit(false);
          setFires((f) => f - 1);
        }
      } else {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", meId);
        if (error) {
          setLit(true);
          setFires((f) => f + 1);
        }
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={!meId}
      style={{
        background: "none",
        border: "none",
        cursor: meId ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        gap: 7,
        color: lit ? "#FF1B6B" : "#F5F5F7",
        padding: 0
      }}
      aria-pressed={lit}
      aria-label={lit ? "Tirar fogo" : "Botar fogo"}
    >
      <Flame
        size={26}
        color={lit ? "#FF1B6B" : "#F5F5F7"}
        fill={lit ? "#FF1B6B" : "none"}
        className={bumping ? "animate-pulse-fire" : ""}
      />
      <span style={{ fontWeight: 700, fontSize: 15 }}>{fires}</span>
    </button>
  );
}
