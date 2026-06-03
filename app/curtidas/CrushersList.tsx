"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Heart, Flame, Eye, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { avatarGradient, timeAgo } from "@/lib/utils";
import type { CrusherPreview } from "@/types/database";

export function CrushersList({ rows, revealed }: { rows: CrusherPreview[]; revealed: boolean }) {
  const router = useRouter();
  const [revealing, setRevealing] = useState<CrusherPreview | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const doReveal = () => {
    if (!revealing) return;
    setErr(null);
    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("reveal_crusher", { preview: revealing.preview_id });
      if (error || !data || !data[0]?.username) {
        setErr(error?.message ?? "Não consegui revelar");
        return;
      }
      const username = (data[0] as { username: string }).username;
      setRevealing(null);
      router.push(`/perfil/${username}`);
    });
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10
        }}
      >
        {rows.map((r) => {
          const inner = (
            <>
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
                {revealed && r.display_name && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 2, textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
                    {r.display_name}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: revealed ? 0 : 8, fontWeight: 600, textAlign: "center" }}>
                  {r.city || "anônimo"}
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>{timeAgo(r.created_at)}</div>
              </div>
            </>
          );

          const cardStyle: React.CSSProperties = {
            position: "relative",
            background: "var(--surface)",
            border: revealed ? "1px solid #FF1B6B" : "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            aspectRatio: "1",
            display: "block",
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer"
          };

          if (revealed && r.username) {
            return (
              <Link key={r.preview_id} href={`/perfil/${r.username}`} style={cardStyle}>
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={r.preview_id}
              onClick={() => setRevealing(r)}
              style={{ ...cardStyle, padding: 0, font: "inherit" }}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {revealing && (
        <div
          onClick={() => !pending && setRevealing(null)}
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
              maxWidth: 380,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 22,
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                margin: "0 auto 12px",
                background: revealing.blur_avatar
                  ? `center/cover no-repeat url(${revealing.blur_avatar}), ${avatarGradient(revealing.preview_id)}`
                  : avatarGradient(revealing.preview_id),
                filter: "blur(14px) saturate(1.4)",
                transform: "scale(1.15)"
              }}
            />
            <div className="display" style={{ fontSize: 22, marginBottom: 4 }}>
              QUER <span style={{ color: "#FF1B6B" }}>DESCOBRIR</span>?
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginTop: 0, marginBottom: 18, lineHeight: 1.4 }}>
              Esse butico curtiu você em segredo. Quer ver quem é?<br />
              {revealing.city && <span style={{ color: "var(--text)" }}>📍 {revealing.city}</span>}
            </p>

            {err && <div style={{ color: "#FF6A9E", fontSize: 13, marginBottom: 10 }}>{err}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setRevealing(null)}
                disabled={pending}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  cursor: pending ? "not-allowed" : "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <X size={14} /> Agora não
              </button>
              <button
                onClick={doReveal}
                disabled={pending}
                className="fire-bg"
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: pending ? "wait" : "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                {pending ? "..." : (<><Eye size={14} /> Revelar 🔥</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
