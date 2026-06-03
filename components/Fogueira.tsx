"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { StoryViewer } from "./StoryViewer";
import type { ActiveStory } from "@/types/database";

interface StoryGroup {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stories: ActiveStory[];
}

export function Fogueira({ groups, meId }: { groups: StoryGroup[]; meId: string | null }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

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

        {groups.map((g, i) => (
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
              padding: 0
            }}
          >
            <Avatar src={g.avatar_url} seed={g.username} initial={g.display_name} size={56} ring />
            <span style={{ fontSize: 12, color: "#F5F5F7", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {g.display_name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <StoryViewer
          groups={groups}
          startIdx={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}
