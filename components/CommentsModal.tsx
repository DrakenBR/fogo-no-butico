"use client";

import { X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

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
        .select("id, body, created_at, user_id, profiles!inner(username, display_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (canceled) return;
      if (!error && data) {
        setComments(data as unknown as CommentRow[]);
      }
      setLoading(false);
    })();

    return () => {
      canceled = true;
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
      .select("id, body, created_at, user_id, profiles!inner(username, display_name, avatar_url)")
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
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <Avatar src={c.profiles?.avatar_url} seed={c.profiles?.username} initial={c.profiles?.display_name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>{c.profiles?.display_name ?? "anônimo"}</span>
                  {c.body}
                </div>
                <div style={{ color: "#9A9AA0", fontSize: 11.5, marginTop: 2 }}>{timeAgo(c.created_at)}</div>
              </div>
            </div>
          ))}
        </div>

        {meId ? (
          <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Manda um comentário..."
              maxLength={500}
              style={{
                flex: 1,
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
