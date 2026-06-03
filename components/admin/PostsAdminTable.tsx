"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, ExternalLink, Flame, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

interface AdminPost {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  caption: string | null;
  created_at: string;
  author: {
    username: string;
    display_name: string;
  } | null;
  fires: number;
  comments: number;
}

export function PostsAdminTable() {
  const [rows, setRows] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, media_url, media_type, caption, created_at, author:profiles!posts_user_id_fkey(username, display_name), reactions(count), comments(count)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      const mapped: AdminPost[] = (data ?? []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        media_url: p.media_url,
        media_type: p.media_type,
        caption: p.caption,
        created_at: p.created_at,
        author: p.author,
        fires: p.reactions?.[0]?.count ?? 0,
        comments: p.comments?.[0]?.count ?? 0
      }));
      setRows(mapped);
      setErr(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deletePost = (post: AdminPost) => {
    const ok = confirm(`Apagar esse post de @${post.author?.username}?\n\nCaption: "${(post.caption ?? "").slice(0, 80)}"`);
    if (!ok) return;
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) {
        alert(`Falhou: ${error.message}`);
        return;
      }
      setRows((r) => r.filter((x) => x.id !== post.id));
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>
          POSTS RECENTES ({rows.length})
        </h2>
      </div>

      {loading && <div style={{ color: "var(--text-muted)", padding: 20 }}>Carregando...</div>}
      {err && <div style={{ color: "#FF6A9E", padding: 12 }}>{err}</div>}

      {!loading && !err && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12
          }}
        >
          {rows.map((p) => (
            <div
              key={p.id}
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ aspectRatio: "1", background: "#000", position: "relative" }}>
                {p.media_type === "video" ? (
                  <video src={p.media_url} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <Link
                    href={`/perfil/${p.author?.username}`}
                    target="_blank"
                    style={{ color: "var(--text)", fontWeight: 700, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    @{p.author?.username}
                  </Link>
                  <span style={{ color: "var(--text-muted)" }}>{timeAgo(p.created_at)}</span>
                </div>
                {p.caption && (
                  <div style={{ color: "var(--text-muted)", fontSize: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.caption}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 6, fontSize: 12.5 }}>
                  <div style={{ display: "flex", gap: 10, color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#FF1B6B", fontWeight: 700 }}>
                      <Flame size={13} fill="#FF1B6B" /> {p.fires}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MessageCircle size={13} /> {p.comments}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Link
                      href={`/perfil/${p.author?.username}/posts/${p.id}`}
                      target="_blank"
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "4px 6px",
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="abrir"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <button
                      onClick={() => deletePost(p)}
                      title="deletar"
                      style={{
                        background: "rgba(255,27,107,0.12)",
                        border: "1px solid rgba(255,27,107,0.25)",
                        borderRadius: 8,
                        padding: "4px 6px",
                        color: "#FF1B6B",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
              Sem posts.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
