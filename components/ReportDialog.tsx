"use client";

import { useState, useTransition } from "react";
import { X, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ReportKind } from "@/types/database";

const REASONS = [
  "Spam",
  "Conteúdo violento ou nudez",
  "Assédio ou bullying",
  "Discurso de ódio",
  "Falso ou enganoso",
  "Outro"
];

export function ReportDialog({
  kind,
  targetId,
  targetLabel,
  onClose
}: {
  kind: ReportKind;
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (!reason || pending) return;
    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErr("Faça login pra denunciar");
        return;
      }
      const body = detail.trim() ? `${reason} — ${detail.trim()}` : reason;
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        kind,
        target_id: targetId,
        reason: body.slice(0, 500)
      });
      if (error) {
        setErr(error.message);
        return;
      }
      setDone(true);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
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
          maxWidth: 420,
          background: "#161519",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          padding: 18
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flag size={18} color="#FF1B6B" />
            <span className="display" style={{ fontSize: 18 }}>DENUNCIAR</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#F5F5F7", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {done ? (
          <>
            <p style={{ color: "#F5F5F7", marginTop: 0 }}>Denúncia enviada 🔥</p>
            <p style={{ color: "#9A9AA0", fontSize: 13.5, marginTop: 4 }}>
              Os admins vão analisar o que rolou com {targetLabel}.
            </p>
            <button
              onClick={onClose}
              className="fire-bg"
              style={{ marginTop: 18, padding: "10px 16px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              Ok
            </button>
          </>
        ) : (
          <>
            <p style={{ color: "#9A9AA0", fontSize: 13.5, marginTop: 0, marginBottom: 14 }}>
              Diz o que houve com {targetLabel}. A denúncia é anônima pra quem foi denunciado.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: reason === r ? "rgba(255,27,107,0.15)" : "#1E1C22",
                    border: reason === r ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.06)",
                    color: reason === r ? "#FF1B6B" : "#F5F5F7",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Detalhes (opcional)"
              rows={3}
              maxLength={400}
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
                disabled={!reason || pending}
                className="fire-bg"
                style={{ flex: 1, padding: "11px 12px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, cursor: pending ? "wait" : "pointer", opacity: !reason || pending ? 0.5 : 1 }}
              >
                {pending ? "Enviando..." : "Denunciar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
