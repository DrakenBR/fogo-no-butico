"use client";

import { Flame } from "lucide-react";
import { useState, useTransition } from "react";
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
