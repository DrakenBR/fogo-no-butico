"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StoryViewer } from "./StoryViewer";
import { photoGradient } from "@/lib/utils";
import type { HighlightCollection, ActiveStory, StoryGroup } from "@/types/database";

interface Props {
  userId: string;
  userUsername: string;
  userDisplayName: string;
  userAvatar: string | null;
  meId: string | null;
}

export function ProfileHighlights({
  userId,
  userUsername,
  userDisplayName,
  userAvatar,
  meId
}: Props) {
  const [collections, setCollections] = useState<HighlightCollection[]>([]);
  const [openGroup, setOpenGroup] = useState<StoryGroup | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("profile_highlights")
        .select("*")
        .eq("user_id", userId)
        .order("last_at", { ascending: false });
      setCollections((data ?? []) as HighlightCollection[]);
    })();
  }, [userId]);

  const openCollection = async (name: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .eq("highlight_collection", name)
      .order("created_at", { ascending: true });
    if (!data) return;
    const stories: ActiveStory[] = data.map((s: any) => ({
      ...s,
      username: userUsername,
      display_name: userDisplayName,
      avatar_url: userAvatar,
      viewed_by_me: false
    }));
    setOpenGroup({
      user_id: userId,
      username: userUsername,
      display_name: userDisplayName,
      avatar_url: userAvatar,
      stories,
      hasUnviewed: true
    });
  };

  if (collections.length === 0) return null;

  return (
    <>
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 12,
          padding: "8px 22px 18px",
          overflowX: "auto"
        }}
      >
        {collections.map((c) => (
          <button
            key={c.highlight_collection}
            onClick={() => openCollection(c.highlight_collection)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              padding: 0
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: c.cover_url
                  ? `center / cover no-repeat url(${c.cover_url}), ${photoGradient(c.highlight_collection)}`
                  : photoGradient(c.highlight_collection),
                border: "2.5px solid #FFB13D",
                position: "relative"
              }}
            >
              <Bookmark
                size={12}
                color="var(--bg)"
                fill="#FFB13D"
                style={{ position: "absolute", bottom: -2, right: -2, background: "#FFB13D", borderRadius: "50%", padding: 2, border: "2px solid #0D0D0F" }}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--text)", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
              {c.highlight_collection}
            </span>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{c.total}</span>
          </button>
        ))}
      </div>

      {openGroup && (
        <StoryViewer
          groups={[openGroup]}
          startIdx={0}
          meId={meId}
          onClose={() => setOpenGroup(null)}
        />
      )}
    </>
  );
}
