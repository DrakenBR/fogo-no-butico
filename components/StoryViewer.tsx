"use client";

import { X, Bookmark, BookmarkCheck, Volume2, VolumeX, Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { StoryViewersDialog } from "./StoryViewersDialog";
import type { StoryGroup } from "@/types/database";

const STORY_DURATION = 5000;

export function StoryViewer({
  groups,
  startIdx,
  onClose,
  onView,
  meId
}: {
  groups: StoryGroup[];
  startIdx: number;
  onClose: () => void;
  onView?: (storyId: string) => void;
  meId?: string | null;
}) {
  const [gi, setGi] = useState(startIdx);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const group = groups[gi];
  const story = group?.stories[si];

  useEffect(() => {
    if (!story) return;
    onView?.(story.id);
    setProgress(0);
    const startedAt = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startedAt) / STORY_DURATION);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else advance();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, si]);

  // Play / pause audio when story changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (story?.audio_url) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }, [story?.audio_url, muted]);

  const advance = () => {
    if (!group) return;
    if (si + 1 < group.stories.length) setSi(si + 1);
    else if (gi + 1 < groups.length) {
      setGi(gi + 1);
      setSi(0);
    } else onClose();
  };

  const back = () => {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      setGi(gi - 1);
      setSi(groups[gi - 1].stories.length - 1);
    }
  };

  if (!story) {
    onClose();
    return null;
  }

  const isMine = !!meId && story.user_id === meId;
  const isHighlighted = !!story.highlight_collection;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.94)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          aspectRatio: "9/16",
          borderRadius: 22,
          background: "#0D0D0F",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        {/* Áudio */}
        {story.audio_url && (
          <audio ref={audioRef} src={story.audio_url} loop preload="auto" />
        )}

        {/* Progress bars */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", gap: 4, zIndex: 3 }}>
          {group.stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  width: i < si ? "100%" : i === si ? `${progress * 100}%` : "0%",
                  height: "100%",
                  background: "#fff",
                  transition: i === si ? "none" : "width .2s"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ position: "absolute", top: 26, left: 14, right: 14, display: "flex", alignItems: "center", gap: 9, zIndex: 3 }}>
          <Avatar src={group.avatar_url} seed={group.username} initial={group.display_name} size={36} />
          <span style={{ fontWeight: 700, color: "#fff", flex: 1, fontSize: 14 }}>
            {group.display_name}{" "}
            <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 400, fontSize: 12 }}>{timeAgo(story.created_at)}</span>
          </span>

          {story.audio_url && (
            <button
              onClick={() => setMuted((m) => !m)}
              style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title={muted ? "Desmutar" : "Mutar"}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}

          {isMine && (
            <button
              onClick={() => setHighlightOpen(true)}
              style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", width: 30, height: 30, color: isHighlighted ? "#FFB13D" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title={isHighlighted ? "Editar destaque" : "Destacar no perfil"}
            >
              {isHighlighted ? <BookmarkCheck size={15} fill="#FFB13D" /> : <Bookmark size={15} />}
            </button>
          )}

          {isMine && (
            <button
              onClick={() => setViewersOpen(true)}
              style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Quem viu"
            >
              <Eye size={15} />
            </button>
          )}

          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 4 }}
          >
            <X size={26} />
          </button>
        </div>

        {/* Tap zones */}
        <button
          onClick={back}
          aria-label="anterior"
          style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "33%", background: "transparent", border: "none", cursor: "pointer", zIndex: 2 }}
        />
        <button
          onClick={advance}
          aria-label="próximo"
          style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "67%", background: "transparent", border: "none", cursor: "pointer", zIndex: 2 }}
        />

        {/* Media */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
          {story.media_type === "video" ? (
            <video src={story.media_url} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.media_url} alt={story.caption ?? "story"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div style={{ position: "absolute", bottom: 24, left: 14, right: 14, color: "#fff", fontSize: 15, textShadow: "0 2px 12px rgba(0,0,0,0.7)", zIndex: 3 }}>
            {story.caption}
          </div>
        )}

        {highlightOpen && isMine && (
          <HighlightDialog
            storyId={story.id}
            currentCollection={story.highlight_collection}
            onClose={() => setHighlightOpen(false)}
            onSaved={(name) => {
              // mutate locally so UI reflects
              story.highlight_collection = name;
              setHighlightOpen(false);
            }}
          />
        )}
      </div>
      {viewersOpen && isMine && (
        <StoryViewersDialog storyId={story.id} onClose={() => setViewersOpen(false)} />
      )}
    </div>
  );
}

function HighlightDialog({
  storyId,
  currentCollection,
  onClose,
  onSaved
}: {
  storyId: string;
  currentCollection: string | null;
  onClose: () => void;
  onSaved: (name: string | null) => void;
}) {
  const [name, setName] = useState(currentCollection ?? "Destaques");
  const [pending, setPending] = useState(false);

  const save = async (collection: string | null) => {
    setPending(true);
    const supabase = createClient();
    await supabase.from("stories").update({ highlight_collection: collection }).eq("id", storyId);
    setPending(false);
    onSaved(collection);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 10
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#161519",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 16
        }}
      >
        <div className="display" style={{ fontSize: 16, color: "#FFB13D", marginBottom: 8 }}>DESTAQUE</div>
        <p style={{ color: "#9A9AA0", fontSize: 12.5, margin: "0 0 12px" }}>
          Dá um nome pra coleção. Esse story fica no teu perfil mesmo depois das 24h.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Ex: Festas, Viagens..."
          style={{
            width: "100%",
            background: "#1E1C22",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 12px",
            color: "#F5F5F7",
            fontSize: 14,
            outline: "none",
            marginBottom: 12
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          {currentCollection && (
            <button
              onClick={() => save(null)}
              disabled={pending}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#FF6A9E", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              Remover destaque
            </button>
          )}
          <button
            onClick={onClose}
            disabled={pending}
            style={{ padding: "10px 12px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#9A9AA0", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            Cancelar
          </button>
          <button
            onClick={() => save(name.trim() || "Destaques")}
            disabled={pending}
            className="fire-bg"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, cursor: pending ? "wait" : "pointer", fontSize: 13 }}
          >
            {pending ? "..." : "Destacar"}
          </button>
        </div>
      </div>
    </div>
  );
}
