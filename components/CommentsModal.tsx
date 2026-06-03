"use client";

import { X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { MentionInput } from "./MentionInput";
import { CommentFireButton } from "./CommentFireButton";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { renderMentions } from "@/lib/render-mentions";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  comment_reactions: { user_id: string }[];
}

export function CommentsModal({
  postId,
  meId,
  onClose
}: {
  postId: string;
  meId: string | null;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let canceled = false;

    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, user_id, profiles:profiles!comments_user_id_fkey(username, display_name, avatar_url), comment_reactions(user_id)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (canceled) return;
      if (!error && data) {
        setComments(data as unknown as CommentRow[]);
      }
      setLoading(false);
    })();

    // realtime: novos comentários, fires de comentário e remoções
    const channel = supabase
      .channel(`realtime:comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        async (payload) => {
          const id = (payload.new as { id?: string }).id;
          if (!id) return;
          // dedupe: se já temos esse comentário (optimistic), ignora
          let alreadyHere = false;
          setComments((prev) => {
            alreadyHere = prev.some((c) => c.id === id);
            return prev;
          });
          if (alreadyHere) return;
          // refetch só o comentário novo com joins
          const { data: full } = await supabase
            .from("comments")
            .select("id, body, created_at, user_id, profiles:profiles!comments_user_id_fkey(username, display_name, avatar_url), comment_reactions(user_id)")
            .eq("id", id)
            .maybeSingle();
          if (full) setComments((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, full as unknown as CommentRow]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          setComments((prev) => prev.filter((c) => c.id !== id));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comment_reactions" },
        (payload) => {
          const row = payload.new as { comment_id?: string; user_id?: string };
          if (!row.comment_id) return;
          setComments((prev) =>
            prev.map((c) =>
              c.id === row.comment_id
                ? {
                    ...c,
                    comment_reactions: c.comment_reactions.some((r) => r.user_id === row.user_id)
                      ? c.comment_reactions
                      : [...c.comment_reactions, { user_id: row.user_id! }]
                  }
                : c
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comment_reactions" },
        (payload) => {
          const row = payload.old as { comment_id?: string; user_id?: string };
          if (!row.comment_id) return;
          setComments((prev) =>
            prev.map((c) =>
              c.id === row.comment_id
                ? { ...c, comment_reactions: c.comment_reactions.filter((r) => r.user_id !== row.user_id) }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      canceled = true;
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const submit = async () => {
    const text = body.trim();
    if (!text || !meId || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: meId, body: text })
      .select("id, body, created_at, user_id, profiles:profiles!comments_user_id_fkey(username, display_name, avatar_url), comment_reactions(user_id)")
      .single();
    setSending(false);
    if (!error && data) {
      setComments((c) => [...c, data as unknown as CommentRow]);
      setBody("");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "85vh",
          background: "#161519",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="display" style={{ fontSize: 18 }}>COMENTÁRIOS</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#F5F5F7" }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px" }}>
          {loading && <div style={{ color: "#9A9AA0", padding: 20, textAlign: "center" }}>Carregando...</div>}
          {!loading && comments.length === 0 && (
            <div style={{ color: "#9A9AA0", padding: 24, textAlign: "center" }}>Ninguém comentou ainda. Quebra o gelo 🔥</div>
          )}
          {comments.map((c) => {
            const fires = c.comment_reactions?.length ?? 0;
            const litByMe = meId ? c.comment_reactions?.some((r) => r.user_id === meId) ?? false : false;
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Avatar src={c.profiles?.avatar_url} seed={c.profiles?.username} initial={c.profiles?.display_name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, marginRight: 6 }}>{c.profiles?.display_name ?? "anônimo"}</span>
                    {renderMentions(c.body)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#9A9AA0", fontSize: 11.5, marginTop: 4 }}>
                    <span>{timeAgo(c.created_at)}</span>
                    <CommentFireButton commentId={c.id} initialFires={fires} initialLit={litByMe} meId={meId} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {meId ? (
          <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <MentionInput
              value={body}
              onChange={setBody}
              onSubmit={submit}
              placeholder="Manda um comentário... (use @ pra arrobar)"
              excludeUserId={meId}
              style={{
                width: "100%",
                background: "#1E1C22",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: "11px 16px",
                color: "#F5F5F7",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              onClick={submit}
              disabled={!body.trim() || sending}
              className="fire-bg"
              style={{
                border: "none",
                borderRadius: "50%",
                width: 42,
                height: 42,
                minWidth: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: !body.trim() || sending ? 0.5 : 1,
                color: "#fff"
              }}
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: "center", color: "#9A9AA0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            Faça login pra comentar
          </div>
        )}
      </div>
    </div>
  );
}
