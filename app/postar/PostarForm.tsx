"use client";

import { Flame, ImagePlus, X, Music, Vote, Plus, Trash2 } from "lucide-react";
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

  // ENQUETE (só pra post)
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // ÁUDIO (só pra story)
  const [audioFile, setAudioFile] = useState<File | null>(null);

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
    // valida poll
    let pollPayload: { question: string; options: string[] } | null = null;
    if (tab === "post" && hasPoll) {
      const q = pollQuestion.trim();
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!q) {
        setErr("Põe a pergunta da enquete");
        return;
      }
      if (opts.length < 2) {
        setErr("Enquete precisa de pelo menos 2 opções");
        return;
      }
      pollPayload = { question: q.slice(0, 200), options: opts.slice(0, 4) };
    }

    start(async () => {
      const supabase = createClient();

      // upload mídia principal
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

      // upload áudio se for story e tiver
      let audioUrl: string | null = null;
      if (tab === "story" && audioFile) {
        if (audioFile.size > 5 * 1024 * 1024) {
          setErr("Áudio passou de 5MB");
          return;
        }
        const aExt = audioFile.name.split(".").pop() ?? "mp3";
        const aPath = `${userId}/audio-${Date.now()}.${aExt}`;
        const { error: aErr } = await supabase.storage
          .from("story-audio")
          .upload(aPath, audioFile, { contentType: audioFile.type, upsert: false });
        if (aErr) {
          setErr(`Áudio: ${aErr.message}`);
          return;
        }
        audioUrl = supabase.storage.from("story-audio").getPublicUrl(aPath).data.publicUrl;
      }

      if (tab === "post") {
        const { error: insErr } = await supabase.from("posts").insert({
          user_id: userId,
          media_url: publicUrl,
          media_type: file.type.startsWith("video/") ? "video" : "photo",
          caption: caption.trim() || null,
          poll: pollPayload
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
          caption: caption.trim() || null,
          audio_url: audioUrl
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

      {tab === "story" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 14px",
            background: audioFile ? "rgba(255,177,61,0.08)" : "#161519",
            border: audioFile ? "1px solid #FFB13D" : "1px dashed rgba(255,177,61,0.45)",
            borderRadius: 12,
            color: audioFile ? "#FFB13D" : "#9A9AA0",
            cursor: "pointer",
            fontSize: 13.5,
            fontWeight: 600
          }}
        >
          <Music size={16} />
          {audioFile ? `Áudio: ${audioFile.name}` : "Adicionar trilha de áudio (opcional)"}
          {audioFile && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setAudioFile(null);
              }}
              style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#FFB13D", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          )}
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
        </label>
      )}

      {tab === "post" && (
        <div style={{ background: "#161519", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={hasPoll}
              onChange={(e) => setHasPoll(e.target.checked)}
              style={{ accentColor: "#FF1B6B" }}
            />
            <Vote size={16} color="#FF1B6B" />
            Adicionar enquete
          </label>

          {hasPoll && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Pergunta da enquete"
                maxLength={200}
                style={{
                  background: "#1E1C22",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "#F5F5F7",
                  fontSize: 14,
                  outline: "none"
                }}
              />
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <input
                    value={opt}
                    onChange={(e) => setPollOptions(pollOptions.map((o, j) => (i === j ? e.target.value : o)))}
                    placeholder={`Opção ${i + 1}`}
                    maxLength={80}
                    style={{
                      flex: 1,
                      background: "#1E1C22",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#F5F5F7",
                      fontSize: 14,
                      outline: "none"
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#9A9AA0", cursor: "pointer", padding: "0 10px" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  style={{ background: "transparent", border: "1px dashed rgba(255,27,107,0.4)", borderRadius: 8, color: "#FF1B6B", padding: "8px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Plus size={14} /> Mais uma opção
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
