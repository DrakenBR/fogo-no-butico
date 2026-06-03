"use client";

import { useState, useTransition } from "react";
import { X, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EditPostDialog({
  postId,
  initialCaption,
  onClose
}: {
  postId: string;
  initialCaption: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("edit_post", {
        post_id: postId,
        new_caption: caption
      });
      if (error) {
        setErr(error.message);
        return;
      }
      router.refresh();
      onClose();
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pencil size={16} color="#FF1B6B" />
            <span className="display" style={{ fontSize: 18 }}>EDITAR POST</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#F5F5F7", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: "#9A9AA0", fontSize: 12.5, margin: 0, marginBottom: 10 }}>
          Você tem 5 minutos pra ajustar depois de publicar.
        </p>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="legenda quente..."
          rows={4}
          maxLength={500}
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
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
