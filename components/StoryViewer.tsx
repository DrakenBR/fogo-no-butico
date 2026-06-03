"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/utils";
import type { ActiveStory } from "@/types/database";

interface StoryGroup {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stories: ActiveStory[];
}

const STORY_DURATION = 5000;

export function StoryViewer({
  groups,
  startIdx,
  onClose
}: {
  groups: StoryGroup[];
  startIdx: number;
  onClose: () => void;
}) {
  const [gi, setGi] = useState(startIdx);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);

  const group = groups[gi];
  const story = group?.stories[si];

  useEffect(() => {
    if (!story) return;
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
      </div>
    </div>
  );
}
