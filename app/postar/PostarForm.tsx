"use client";

import { Flame, ImagePlus, X, Music, Vote, Plus, Trash2, Clock, Sparkles, ChevronLeft, ChevronRight, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyFilter, compressImage, type FilterPreset, FILTER_PRESETS } from "@/lib/utils";

type Tab = "post" | "story";

interface MediaSlot {
  file: File;
  previewUrl: string;
  filter: FilterPreset;
  filteredBlob?: Blob;
}

const SCHEDULE_OPTIONS = [
  { label: "Agora", hours: 0 },
  { label: "+1h", hours: 1 },
  { label: "+6h", hours: 6 },
  { label: "+24h", hours: 24 },
  { label: "+3 dias", hours: 72 }
];

export function PostarForm({ userId, initialTab }: { userId: string; initialTab: Tab }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [slots, setSlots] = useState<MediaSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [caption, setCaption] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // ENQUETE
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // ÁUDIO STORY
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // AGENDAMENTO
  const [scheduleH, setScheduleH] = useState(0);

  // ANÔNIMO
  const [isAnon, setIsAnon] = useState(false);

  const MAX_SLOTS = tab === "post" ? 6 : 1;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, MAX_SLOTS - slots.length);
    const next: MediaSlot[] = arr.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      filter: "original"
    }));
    setSlots((s) => [...s, ...next]);
  };

  const removeSlot = (idx: number) => {
    URL.revokeObjectURL(slots[idx].previewUrl);
    setSlots((s) => s.filter((_, i) => i !== idx));
    setCurrentSlot((c) => Math.max(0, Math.min(c, slots.length - 2)));
  };

  const setFilter = async (idx: number, filter: FilterPreset) => {
    const slot = slots[idx];
    if (slot.file.type.startsWith("video/")) return;
    const filtered = filter === "original" ? undefined : await applyFilter(slot.file, filter);
    setSlots((s) => s.map((sl, i) => (i === idx ? { ...sl, filter, filteredBlob: filtered } : sl)));
  };

  const cur = slots[currentSlot];
  const isVideo = cur?.file.type.startsWith("video/");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slots.length === 0) {
      setErr("Escolhe pelo menos uma mídia");
      return;
    }
    let pollPayload: { question: string; options: string[] } | null = null;
    if (tab === "post" && hasPoll) {
      const q = pollQuestion.trim();
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!q) return setErr("Põe a pergunta da enquete");
      if (opts.length < 2) return setErr("Enquete precisa de pelo menos 2 opções");
      pollPayload = { question: q.slice(0, 200), options: opts.slice(0, 4) };
    }

    start(async () => {
      const supabase = createClient();

      // upload todas as mídias
      const urls: string[] = [];
      const types: ("photo" | "video")[] = [];
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        let upload: Blob = slot.filteredBlob ?? slot.file;
        let contentType = slot.file.type;
        let ext = slot.file.name.split(".").pop() ?? "bin";
        if (slot.file.type.startsWith("image/") && !slot.filteredBlob) {
          upload = await compressImage(slot.file, 1600, 0.85);
          contentType = "image/jpeg";
          ext = "jpg";
        } else if (slot.filteredBlob) {
          contentType = "image/jpeg";
          ext = "jpg";
        }
        const path = `${userId}/${tab}-${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, upload, { contentType, upsert: false });
        if (upErr) {
          setErr(`Upload ${i + 1}: ${upErr.message}`);
          return;
        }
        urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
        types.push(slot.file.type.startsWith("video/") ? "video" : "photo");
      }

      // áudio (só story)
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
        const scheduledFor = scheduleH > 0 ? new Date(Date.now() + scheduleH * 3600 * 1000).toISOString() : null;
        const { error: insErr } = await supabase.from("posts").insert({
          user_id: userId,
          media_url: urls[0],
          media_type: types[0],
          media_urls: urls.length > 1 ? urls : null,
          media_types: urls.length > 1 ? types : null,
          caption: caption.trim() || null,
          poll: pollPayload,
          scheduled_for: scheduledFor,
          is_anonymous: isAnon
        });
        if (insErr) {
          setErr(insErr.message);
          return;
        }
        router.push(scheduledFor ? `/perfil` : "/");
        router.refresh();
      } else {
        const { error: insErr } = await supabase.from("stories").insert({
          user_id: userId,
          media_url: urls[0],
          media_type: types[0],
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

  const filterCss = cur ? FILTER_PRESETS[cur.filter] : "none";

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, background: "var(--surface)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
        {(["post", "story"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              // limita slot 0 se mudou de post pra story
              if (t === "story" && slots.length > 1) setSlots((s) => s.slice(0, 1));
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 8,
              background: tab === t ? "rgba(255,27,107,0.18)" : "transparent",
              color: tab === t ? "#FF1B6B" : "var(--text-muted)",
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
          background: cur ? "#000" : "var(--surface)",
          border: "1px dashed rgba(255,255,255,0.15)",
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: cur ? "default" : "pointer",
          overflow: "hidden",
          position: "relative"
        }}
        onClick={(e) => {
          // só abre file picker se NÃO houver mídia ainda
          if (cur) e.preventDefault();
        }}
      >
        {!cur && (
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <ImagePlus size={42} style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 600 }}>Toque pra escolher</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{tab === "post" ? "foto ou vídeo (até 6)" : "foto ou vídeo"}</div>
          </div>
        )}
        {cur && isVideo && (
          <video src={cur.previewUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {cur && !isVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cur.filteredBlob ? URL.createObjectURL(cur.filteredBlob) : cur.previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", filter: cur.filteredBlob ? "none" : filterCss }} />
        )}

        {/* slot nav */}
        {slots.length > 1 && (
          <>
            <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "3px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              {currentSlot + 1}/{slots.length}
            </div>
            {currentSlot > 0 && (
              <button type="button" onClick={() => setCurrentSlot(currentSlot - 1)} style={slotNav("left")}><ChevronLeft size={18} /></button>
            )}
            {currentSlot < slots.length - 1 && (
              <button type="button" onClick={() => setCurrentSlot(currentSlot + 1)} style={slotNav("right")}><ChevronRight size={18} /></button>
            )}
          </>
        )}

        {cur && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              removeSlot(currentSlot);
            }}
            style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={18} />
          </button>
        )}

        <input
          type="file"
          accept="image/*,video/*"
          multiple={tab === "post"}
          onChange={(e) => addFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </label>

      {/* filtros + adicionar mais */}
      {cur && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isVideo && (
            <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1 }}>
              {(Object.keys(FILTER_PRESETS) as FilterPreset[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(currentSlot, f)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: cur.filter === f ? "rgba(255,27,107,0.15)" : "var(--surface)",
                    border: cur.filter === f ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
                    color: cur.filter === f ? "#FF1B6B" : "var(--text)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {f === "original" ? "Sem filtro" : (<><Sparkles size={11} /> {f}</>)}
                </button>
              ))}
            </div>
          )}
          {tab === "post" && slots.length < MAX_SLOTS && (
            <label style={{ background: "rgba(255,27,107,0.1)", border: "1px dashed rgba(255,27,107,0.4)", borderRadius: 999, padding: "6px 10px", color: "#FF1B6B", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
              <Plus size={13} /> Mais
              <input type="file" accept="image/*,video/*" multiple onChange={(e) => addFiles(e.target.files)} style={{ display: "none" }} />
            </label>
          )}
        </div>
      )}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={tab === "post" ? "escreve uma legenda quente..." : "uma legendinha pro story (opcional)"}
        maxLength={500}
        rows={3}
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: 14,
          color: "var(--text)",
          fontSize: 15,
          outline: "none",
          resize: "vertical"
        }}
      />

      {tab === "story" && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: audioFile ? "rgba(255,177,61,0.08)" : "var(--surface)", border: audioFile ? "1px solid #FFB13D" : "1px dashed rgba(255,177,61,0.45)", borderRadius: 12, color: audioFile ? "#FFB13D" : "var(--text-muted)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>
          <Music size={16} />
          {audioFile ? `Áudio: ${audioFile.name}` : "Adicionar trilha (opcional)"}
          {audioFile && (
            <button type="button" onClick={(e) => { e.preventDefault(); setAudioFile(null); }} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#FFB13D", cursor: "pointer" }}>
              <X size={14} />
            </button>
          )}
          <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
        </label>
      )}

      {tab === "post" && (
        <>
          <div style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              <input type="checkbox" checked={hasPoll} onChange={(e) => setHasPoll(e.target.checked)} style={{ accentColor: "#FF1B6B" }} />
              <Vote size={16} color="#FF1B6B" />
              Adicionar enquete
            </label>
            {hasPoll && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Pergunta da enquete" maxLength={200} style={{ background: "var(--surface-up)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontSize: 14, outline: "none" }} />
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: 6 }}>
                    <input value={opt} onChange={(e) => setPollOptions(pollOptions.map((o, j) => (i === j ? e.target.value : o)))} placeholder={`Opção ${i + 1}`} maxLength={80} style={{ flex: 1, background: "var(--surface-up)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "9px 12px", color: "var(--text)", fontSize: 14, outline: "none" }} />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", padding: "0 10px" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} style={{ background: "transparent", border: "1px dashed rgba(255,27,107,0.4)", borderRadius: 8, color: "#FF1B6B", padding: "8px", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Plus size={14} /> Mais uma opção
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} style={{ accentColor: "#FF1B6B" }} />
              <EyeOff size={16} color="#C49BFF" />
              Modo anônimo (só revela se der match)
            </label>
            {isAnon && (
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
                Esse post vai aparecer como <span style={{ color: "#C49BFF", fontWeight: 700 }}>Butico Anônimo</span>. Quem te curtir só vai descobrir quem é se você curtir de volta.
              </div>
            )}
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              <Clock size={16} color="#FFB13D" /> Quando publicar?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setScheduleH(opt.hours)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: scheduleH === opt.hours ? "rgba(255,177,61,0.15)" : "var(--surface-up)",
                    border: scheduleH === opt.hours ? "1px solid #FFB13D" : "1px solid rgba(255,255,255,0.06)",
                    color: scheduleH === opt.hours ? "#FFB13D" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {scheduleH > 0 && (
              <div style={{ color: "#FFB13D", fontSize: 12, marginTop: 8 }}>
                Vai publicar em {new Date(Date.now() + scheduleH * 3600 * 1000).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        </>
      )}

      {err && <div style={{ color: "#FF6A9E", fontSize: 13.5, textAlign: "center" }}>{err}</div>}

      <button
        type="submit"
        disabled={pending}
        className="fire-bg display"
        style={{ padding: 14, borderRadius: 14, border: "none", cursor: pending ? "not-allowed" : "pointer", color: "#fff", fontSize: 17, letterSpacing: 1, opacity: pending ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <Flame size={20} />
        {pending ? "BOTANDO FOGO..." : scheduleH > 0 ? "AGENDAR" : tab === "post" ? "POSTAR" : "ACENDER FOGUEIRA"}
      </button>
    </form>
  );
}

function slotNav(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 8,
    background: "rgba(0,0,0,0.6)",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
}
