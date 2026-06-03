"use client";

import { Flame, ImagePlus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils";

type Tab = "post" | "story";

export function PostarForm({ userId, initialTab }: { userId: string; initialTab: Tab }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const onPick = (f: File | null) => {
    setErr(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const isVideo = file?.type.startsWith("video/");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErr("Escolhe uma mídia");
      return;
    }
    start(async () => {
      const supabase = createClient();

      let upload: Blob = file;
      let contentType = file.type;
      let ext = file.name.split(".").pop() ?? "bin";
      if (file.type.startsWith("image/")) {
        upload = await compressImage(file, 1600, 0.85);
        contentType = "image/jpeg";
        ext = "jpg";
      }

      const path = `${userId}/${tab}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, upload, { contentType, upsert: false });
      if (upErr) {
        setErr(`Upload falhou: ${upErr.message}`);
        return;
      }
      const publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;

      if (tab === "post") {
        const { error: insErr } = await supabase.from("posts").insert({
          user_id: userId,
          media_url: publicUrl,
          media_type: file.type.startsWith("video/") ? "video" : "photo",
          caption: caption.trim() || null
        });
        if (insErr) {
          setErr(insErr.message);
          return;
        }
        router.push("/");
        router.refresh();
      } else {
        const { error: insErr } = await supabase.from("stories").insert({
          user_id: userId,
          media_url: publicUrl,
          media_type: file.type.startsWith("video/") ? "video" : "photo",
          caption: caption.trim() || null
        });
        if (insErr) {
          setErr(insErr.message);
          return;
        }
        router.push("/");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, background: "#161519", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
        {(["post", "story"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 8,
              background: tab === t ? "rgba(255,27,107,0.18)" : "transparent",
              color: tab === t ? "#FF1B6B" : "#9A9AA0",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            {t === "post" ? "POST" : "FOGUEIRA (24h)"}
          </button>
        ))}
      </div>

      <label
        style={{
          aspectRatio: tab === "story" ? "9/16" : "4/5",
          background: previewUrl ? "#000" : "#161519",
          border: "1px dashed rgba(255,255,255,0.15)",
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {!previewUrl && (
          <div style={{ textAlign: "center", color: "#9A9AA0" }}>
            <ImagePlus size={42} style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 600 }}>Toque pra escolher</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>foto ou vídeo</div>
          </div>
        )}
        {previewUrl && isVideo && (
          <video src={previewUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {previewUrl && !isVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {previewUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onPick(null);
            }}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.6)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        )}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
      </label>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={tab === "post" ? "escreve uma legenda quente..." : "uma legendinha pro story (opcional)"}
        maxLength={500}
        rows={3}
        style={{
          background: "#161519",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: 14,
          color: "#F5F5F7",
          fontSize: 15,
          outline: "none",
          resize: "vertical"
        }}
      />

      {err && <div style={{ color: "#FF6A9E", fontSize: 13.5, textAlign: "center" }}>{err}</div>}

      <button
        type="submit"
        disabled={pending}
        className="fire-bg display"
        style={{
          padding: 14,
          borderRadius: 14,
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          color: "#fff",
          fontSize: 17,
          letterSpacing: 1,
          opacity: pending ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }}
      >
        <Flame size={20} />
        {pending ? "BOTANDO FOGO..." : tab === "post" ? "POSTAR" : "ACENDER FOGUEIRA"}
      </button>
    </form>
  );
}
