"use client";

import { Lock, Heart } from "lucide-react";
import { avatarGradient, timeAgo } from "@/lib/utils";
import type { CrusherPreview } from "@/types/database";

export function CrushersList({ rows, revealed }: { rows: CrusherPreview[]; revealed: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 10
      }}
    >
      {rows.map((r) => (
        <div
          key={r.preview_id}
          style={{
            position: "relative",
            background: "var(--surface)",
            border: revealed ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden",
            aspectRatio: "1"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: r.blur_avatar
                ? `center / cover no-repeat url(${r.blur_avatar}), ${avatarGradient(r.preview_id)}`
                : avatarGradient(r.preview_id),
              filter: revealed ? "none" : "blur(18px) saturate(1.4)",
              transform: revealed ? "none" : "scale(1.2)"
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: revealed
                ? "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)"
                : "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: revealed ? "flex-end" : "center",
              alignItems: "center",
              padding: 10,
              color: "#fff"
            }}
          >
            {!revealed && (
              <>
                <Lock size={20} style={{ marginBottom: 6, opacity: 0.85 }} />
                <div className="display" style={{ fontSize: 30, lineHeight: 1, opacity: 0.95 }}>
                  {r.initial}
                </div>
              </>
            )}
            {revealed && (
              <Heart size={18} fill="#FF1B6B" color="#FF1B6B" style={{ position: "absolute", top: 8, right: 8 }} />
            )}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: revealed ? 0 : 8, fontWeight: 600, textAlign: "center" }}>
              {r.city || "anônimo"}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>{timeAgo(r.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
