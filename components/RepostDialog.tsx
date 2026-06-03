"use client";

import { useState, useTransition } from "react";
import { X, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function RepostDialog({
  originalPostId,
  originalMediaUrl,
  originalMediaType,
  originalCaption,
  originalAuthorName,
  onClose,
  onDone
}: {
  originalPostId: string;
  originalMediaUrl: string;
  originalMediaType: "photo" | "video";
  originalCaption: string | null;
  originalAuthorName: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (pending) return;
    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErr("Faça login");
        return;
      }
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        media_url: originalMediaUrl,
        media_type: originalMediaType,
        caption: caption.trim() || null,
        original_post_id: originalPostId
      });
      if (error) {
        setErr(error.message);
        return;
      }
      onDone?.();
      onClose();
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#161519",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: 18
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={18} color="#FF1B6B" fill="#FF1B6B" />
            <span className="display" style={{ fontSize: 18 }}>JOGAR MAIS FOGO</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#F5F5F7", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: "#9A9AA0", fontSize: 13.5, marginTop: 0, marginBottom: 12 }}>
          Repostando @{originalAuthorName.split(" ")[0]} no teu feed.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: 10,
            background: "#1E1C22",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 12,
            alignItems: "center"
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#000" }}>
            {originalMediaType === "video" ? (
              <video src={originalMediaUrl} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={originalMediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{originalAuthorName}</div>
            {originalCaption && (
              <div style={{ color: "#9A9AA0", fontSize: 12.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: 2 }}>
                {originalCaption}
              </div>
            )}
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Adiciona uma vibe (opcional)"
          maxLength={500}
          rows={3}
          style={{
            width: "100%",
            background: "#1E1C22",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: 12,
            color: "#F5F5F7",
            fontSize: 14,
            outline: "none",
            resize: "vertical"
          }}
        />

        {err && <div style={{ color: "#FF6A9E", fontSize: 13, marginTop: 8 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "11px 12px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#9A9AA0", fontWeight: 700, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="fire-bg"
            style={{ flex: 1, padding: "11px 12px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.6 : 1 }}
          >
            {pending ? "Postando..." : "JOGAR FOGO 🔥"}
          </button>
        </div>
      </div>
    </div>
  );
}
