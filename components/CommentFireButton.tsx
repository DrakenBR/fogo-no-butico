"use client";

import { Flame } from "lucide-react";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  commentId: string;
  initialFires: number;
  initialLit: boolean;
  meId: string | null;
}

export function CommentFireButton({ commentId, initialFires, initialLit, meId }: Props) {
  const [fires, setFires] = useState(initialFires);
  const [lit, setLit] = useState(initialLit);
  const [pending, start] = useTransition();
  const [bump, setBump] = useState(false);

  const toggle = () => {
    if (!meId || pending) return;
    const next = !lit;
    setLit(next);
    setFires((f) => f + (next ? 1 : -1));
    setBump(true);
    setTimeout(() => setBump(false), 400);

    start(async () => {
      const supabase = createClient();
      if (next) {
        const { error } = await supabase
          .from("comment_reactions")
          .insert({ comment_id: commentId, user_id: meId, type: "fire" });
        if (error && error.code !== "23505") {
          setLit(false);
          setFires((f) => f - 1);
        }
      } else {
        const { error } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("comment_id", commentId)
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
      type="button"
      onClick={toggle}
      disabled={!meId}
      title={lit ? "tirar fogo" : "botar fogo"}
      style={{
        background: "none",
        border: "none",
        cursor: meId ? "pointer" : "not-allowed",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: lit ? "#FF1B6B" : "#9A9AA0",
        padding: 2,
        fontSize: 12,
        fontWeight: 600
      }}
    >
      <Flame size={14} color={lit ? "#FF1B6B" : "#9A9AA0"} fill={lit ? "#FF1B6B" : "none"} className={bump ? "animate-pulse-fire" : ""} />
      {fires > 0 && <span>{fires}</span>}
    </button>
  );
}
