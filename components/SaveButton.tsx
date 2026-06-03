"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  postId: string;
  initialSaved: boolean;
  meId: string | null;
}

export function SaveButton({ postId, initialSaved, meId }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  const toggle = () => {
    if (!meId || pending) return;
    const next = !saved;
    setSaved(next);
    start(async () => {
      const supabase = createClient();
      if (next) {
        const { error } = await supabase.from("saved_posts").insert({ user_id: meId, post_id: postId });
        if (error && error.code !== "23505") setSaved(false);
      } else {
        const { error } = await supabase.from("saved_posts").delete().eq("user_id", meId).eq("post_id", postId);
        if (error) setSaved(true);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={!meId}
      title={saved ? "Tirar dos salvos" : "Salvar"}
      style={{
        background: "none",
        border: "none",
        cursor: meId ? "pointer" : "not-allowed",
        color: saved ? "#FFB13D" : "var(--text-muted)",
        padding: 0,
        marginLeft: "auto",
        display: "flex",
        alignItems: "center"
      }}
      aria-pressed={saved}
    >
      <Bookmark size={22} fill={saved ? "#FFB13D" : "none"} />
    </button>
  );
}
