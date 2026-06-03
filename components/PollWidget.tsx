"use client";

import { useEffect, useState, useTransition } from "react";
import { Vote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Poll } from "@/types/database";

interface Props {
  postId: string;
  poll: Poll;
  meId: string | null;
}

export function PollWidget({ postId, poll, meId }: Props) {
  const [counts, setCounts] = useState<number[]>(() => poll.options.map(() => 0));
  const [myChoice, setMyChoice] = useState<number | null>(null);
  const [pending, start] = useTransition();

  // load votes
  useEffect(() => {
    const supabase = createClient();
    let canceled = false;

    const refetch = async () => {
      const { data } = await supabase
        .from("poll_votes")
        .select("option_idx, user_id")
        .eq("post_id", postId);
      if (canceled || !data) return;
      const c = poll.options.map(() => 0);
      let mine: number | null = null;
      for (const v of data as { option_idx: number; user_id: string }[]) {
        if (v.option_idx >= 0 && v.option_idx < c.length) c[v.option_idx] += 1;
        if (meId && v.user_id === meId) mine = v.option_idx;
      }
      setCounts(c);
      setMyChoice(mine);
    };

    refetch();

    // realtime
    const channel = supabase
      .channel(`realtime:poll:${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes", filter: `post_id=eq.${postId}` },
        () => refetch()
      )
      .subscribe();

    return () => {
      canceled = true;
      supabase.removeChannel(channel);
    };
  }, [postId, meId, poll.options.length]);

  const vote = (idx: number) => {
    if (!meId || pending) return;
    const prev = myChoice;
    setMyChoice(idx);
    // optimistic counts adjust
    setCounts((c) => {
      const n = [...c];
      if (prev !== null) n[prev] = Math.max(0, n[prev] - 1);
      n[idx] = (n[idx] ?? 0) + 1;
      return n;
    });
    start(async () => {
      const supabase = createClient();
      // upsert: vote único por user
      const { error } = await supabase
        .from("poll_votes")
        .upsert({ post_id: postId, user_id: meId, option_idx: idx }, { onConflict: "post_id,user_id" });
      if (error) {
        // rollback
        setMyChoice(prev);
      }
    });
  };

  const total = counts.reduce((a, b) => a + b, 0);
  const showResults = myChoice !== null || total > 0;

  return (
    <div style={{ padding: "0 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9A9AA0", fontSize: 13, marginBottom: 8 }}>
        <Vote size={14} />
        <span style={{ fontWeight: 700, color: "#F5F5F7" }}>{poll.question}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {poll.options.map((opt, i) => {
          const c = counts[i] ?? 0;
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          const mine = myChoice === i;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={!meId || pending}
              style={{
                position: "relative",
                padding: "10px 14px",
                borderRadius: 10,
                border: mine ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
                background: "#1E1C22",
                color: "#F5F5F7",
                cursor: meId ? "pointer" : "not-allowed",
                textAlign: "left",
                overflow: "hidden",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {showResults && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${pct}%`,
                    background: mine ? "rgba(255,27,107,0.20)" : "rgba(255,255,255,0.05)",
                    transition: "width .3s ease"
                  }}
                />
              )}
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
                <span>{opt}</span>
                {showResults && <span style={{ color: "#9A9AA0", fontSize: 12 }}>{pct}% · {c}</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ color: "#9A9AA0", fontSize: 11.5, marginTop: 6 }}>
        {total} voto{total === 1 ? "" : "s"}{!meId ? " · faça login pra votar" : ""}
      </div>
    </div>
  );
}
