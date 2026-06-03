"use client";

import { MessageCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { FireButton } from "./FireButton";
import { CommentsModal } from "./CommentsModal";
import { lookingStyle, photoGradient, timeAgo } from "@/lib/utils";
import type { FeedPost } from "@/types/database";

export function PostCard({ post, meId }: { post: FeedPost; meId: string | null }) {
  const tag = lookingStyle[post.author.looking_for];
  const [openComments, setOpenComments] = useState(false);

  return (
    <article style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "18px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 18px 14px" }}>
        <Link href={`/perfil/${post.author.username}`}>
          <Avatar src={post.author.avatar_url} seed={post.author.username} initial={post.author.display_name} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/perfil/${post.author.username}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{post.author.display_name}</div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9A9AA0", fontSize: 12.5 }}>
            <MapPin size={12} /> {post.author.city || "—"} · {timeAgo(post.created_at)}
          </div>
        </div>
        <span style={{ background: tag.bg, color: tag.color, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20, flexShrink: 0 }}>
          {tag.label}
        </span>
      </div>

      <div style={{ margin: "0 18px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: photoGradient(post.id) }}>
        {post.media_type === "video" ? (
          <video
            src={post.media_url}
            controls
            playsInline
            style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block", background: "#000" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.media_url}
            alt={post.caption || "post"}
            style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }}
          />
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 18px 8px" }}>
        <FireButton postId={post.id} initialFires={post.fires} initialLit={post.liked_by_me} meId={meId} />
        <button
          onClick={() => setOpenComments(true)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, color: "#9A9AA0", padding: 0 }}
        >
          <MessageCircle size={24} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{post.comments_count}</span>
        </button>
      </div>

      {post.caption && (
        <p style={{ padding: "0 18px", fontSize: 15, lineHeight: 1.45, margin: 0 }}>
          <Link href={`/perfil/${post.author.username}`} style={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}>
            {post.author.display_name.split(" ")[0]}{" "}
          </Link>
          {post.caption}
        </p>
      )}

      {post.comments_count > 0 && (
        <button
          onClick={() => setOpenComments(true)}
          style={{ background: "none", border: "none", padding: "8px 18px 0", color: "#9A9AA0", fontSize: 13.5, cursor: "pointer", display: "block" }}
        >
          Ver todos os {post.comments_count} comentários
        </button>
      )}

      {openComments && (
        <CommentsModal
          postId={post.id}
          meId={meId}
          onClose={() => setOpenComments(false)}
        />
      )}
    </article>
  );
}
