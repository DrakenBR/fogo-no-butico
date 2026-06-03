"use client";

import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { StoryViewer } from "./StoryViewer";
import { createClient } from "@/lib/supabase/client";
import type { StoryGroup } from "@/types/database";

export function Fogueira({ groups: initialGroups, meId }: { groups: StoryGroup[]; meId: string | null }) {
  // Set local de stories que o user já viu (semente: o que veio do servidor)
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    initialGroups.forEach((g) => g.stories.forEach((st) => st.viewed_by_me && s.add(st.id)));
    return s;
  });

  const sortedGroups = useMemo(() => {
    const withFlag = initialGroups.map((g) => ({
      ...g,
      hasUnviewed: g.stories.some((s) => !viewedIds.has(s.id))
    }));
    return withFlag.sort((a, b) => {
      if (a.hasUnviewed === b.hasUnviewed) return 0;
      return a.hasUnviewed ? -1 : 1;
    });
  }, [initialGroups, viewedIds]);

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const markViewed = async (storyId: string) => {
    if (viewedIds.has(storyId)) return;
    setViewedIds((prev) => new Set(prev).add(storyId));
    if (!meId) return;
    const supabase = createClient();
    await supabase.from("story_views").insert({ story_id: storyId, user_id: meId });
  };

  return (
    <>
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          padding: "20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <Link
          href="/postar?tipo=story"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              background: "#1E1C22",
              border: "2px dashed #FF1B6B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <PlusCircle size={26} color="#FF1B6B" />
          </div>
          <span style={{ fontSize: 12, color: "#9A9AA0", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Você
          </span>
        </Link>

        {sortedGroups.map((g, i) => (
          <button
            key={g.user_id}
            onClick={() => setOpenIdx(i)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
              padding: 0,
              opacity: g.hasUnviewed ? 1 : 0.7
            }}
          >
            <Avatar
              src={g.avatar_url}
              seed={g.username}
              initial={g.display_name}
              size={56}
              ring={g.hasUnviewed}
            />
            <span
              style={{
                fontSize: 12,
                color: g.hasUnviewed ? "#F5F5F7" : "#9A9AA0",
                maxWidth: 64,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {g.display_name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <StoryViewer
          groups={sortedGroups}
          startIdx={openIdx}
          onView={markViewed}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}
