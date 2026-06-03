"use client";

import { useEffect, useState } from "react";
import { X, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/utils";
import type { StoryViewer } from "@/types/database";

export function StoryViewersDialog({
  storyId,
  onClose
}: {
  storyId: string;
  onClose: () => void;
}) {
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase.rpc("story_viewers", { target_story: storyId });
      if (error) setErr(error.message);
      else setViewers((data ?? []) as StoryViewer[]);
      setLoading(false);
    })();
  }, [storyId]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 90,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "75vh",
          background: "var(--surface)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={18} />
            <span className="display" style={{ fontSize: 18 }}>QUEM VIU ({viewers.length})</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px" }}>
          {loading && <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Carregando...</div>}
          {err && <div style={{ color: "#FF6A9E", padding: 12 }}>{err}</div>}
          {!loading && viewers.length === 0 && !err && (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>Ninguém viu ainda 👀</div>
          )}
          {viewers.map((v) => (
            <a
              key={v.user_id}
              href={`/perfil/${v.username}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", textDecoration: "none", color: "inherit", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Avatar src={v.avatar_url} seed={v.username} initial={v.display_name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.display_name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>@{v.username}</div>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{timeAgo(v.viewed_at)}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
