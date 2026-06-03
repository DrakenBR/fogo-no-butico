"use client";

import { MessageCircle, MapPin, MoreHorizontal, Flag, Repeat, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { FireButton } from "./FireButton";
import { CommentsModal } from "./CommentsModal";
import { ReportDialog } from "./ReportDialog";
import { RepostDialog } from "./RepostDialog";
import { PollWidget } from "./PollWidget";
import { MediaCarousel } from "./MediaCarousel";
import { SaveButton } from "./SaveButton";
import { EditPostDialog } from "./EditPostDialog";
import { createClient } from "@/lib/supabase/client";
import { lookingStyle, photoGradient, timeAgo } from "@/lib/utils";
import type { FeedPost } from "@/types/database";

export function PostCard({ post, meId }: { post: FeedPost; meId: string | null }) {
  const router = useRouter();
  const tag = lookingStyle[post.author.looking_for];
  const [openComments, setOpenComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isMine = !!meId && meId === post.author.id;
  const isRepost = !!post.original_post_id && !!post.original;

  // mídia mostrada: prefere média do original se for repost, senão usa do próprio post (multi ou single)
  const sourceUrls = isRepost
    ? (post.original!.media_urls?.length ? post.original!.media_urls : [post.original!.media_url])
    : (post.media_urls?.length ? post.media_urls : [post.media_url]);
  const sourceTypes = isRepost
    ? (post.original!.media_types?.length ? post.original!.media_types : [post.original!.media_type])
    : (post.media_types?.length ? post.media_types : [post.media_type]);

  const canEdit = isMine && new Date(post.created_at).getTime() > Date.now() - 5 * 60 * 1000;

  const onDelete = async () => {
    if (!confirm("Apagar esse post?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <article style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "18px 0" }}>
      {isRepost && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px 6px", color: "#9A9AA0", fontSize: 12.5 }}>
          <Repeat size={13} color="#FF1B6B" />
          <Link href={`/perfil/${post.author.username}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
            {post.author.display_name}
          </Link>
          <span>jogou mais fogo</span>
          {post.original!.author && (
            <>
              <span>em</span>
              <Link href={`/perfil/${post.original!.author.username}`} style={{ color: "#FF1B6B", textDecoration: "none", fontWeight: 700 }}>
                @{post.original!.author.username}
              </Link>
            </>
          )}
        </div>
      )}

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
            {post.edited_at && <span style={{ fontStyle: "italic", marginLeft: 4 }}>· editado</span>}
          </div>
        </div>
        <span style={{ background: tag.bg, color: tag.color, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20, flexShrink: 0 }}>
          {tag.label}
        </span>
        {meId && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="opções"
              style={{ background: "none", border: "none", color: "#9A9AA0", cursor: "pointer", padding: 4 }}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  background: "#1E1C22",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: 4,
                  minWidth: 170,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
                  zIndex: 5
                }}
              >
                {canEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                    style={menuItem("#F5F5F7")}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                )}
                {isMine && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    style={menuItem("#FF6A9E")}
                  >
                    <Trash2 size={14} /> Apagar
                  </button>
                )}
                {!isMine && (
                  <button
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    style={menuItem("#FF6A9E")}
                  >
                    <Flag size={14} /> Denunciar post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ margin: "0 18px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: photoGradient(post.id) }}>
        <MediaCarousel urls={sourceUrls} types={sourceTypes} alt={post.caption ?? "post"} bg={photoGradient(post.id)} />
      </div>

      {post.poll && <div style={{ marginTop: 12 }}><PollWidget postId={post.id} poll={post.poll} meId={meId} /></div>}

      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 18px 8px" }}>
        <FireButton postId={post.id} initialFires={post.fires} initialLit={post.liked_by_me} meId={meId} />
        <button
          onClick={() => setOpenComments(true)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, color: "#9A9AA0", padding: 0 }}
        >
          <MessageCircle size={24} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{post.comments_count}</span>
        </button>
        {meId && !isMine && (
          <button
            onClick={() => setRepostOpen(true)}
            title="Jogar mais fogo (repostar)"
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#9A9AA0", padding: 0 }}
          >
            <Repeat size={22} />
          </button>
        )}
        <SaveButton postId={post.id} initialSaved={post.saved_by_me} meId={meId} />
      </div>

      {post.caption && (
        <p style={{ padding: "0 18px", fontSize: 15, lineHeight: 1.45, margin: 0 }}>
          <Link href={`/perfil/${post.author.username}`} style={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}>
            {post.author.display_name.split(" ")[0]}{" "}
          </Link>
          {post.caption}
        </p>
      )}

      {isRepost && post.original?.caption && (
        <div style={{ padding: "8px 18px 0" }}>
          <div style={{ borderLeft: "3px solid #FF1B6B", paddingLeft: 10, fontSize: 13, color: "#9A9AA0" }}>
            <span style={{ fontWeight: 700, color: "#F5F5F7" }}>{post.original.author?.display_name?.split(" ")[0]}{" "}</span>
            {post.original.caption}
          </div>
        </div>
      )}

      {post.comments_count > 0 && (
        <button
          onClick={() => setOpenComments(true)}
          style={{ background: "none", border: "none", padding: "8px 18px 0", color: "#9A9AA0", fontSize: 13.5, cursor: "pointer", display: "block" }}
        >
          Ver todos os {post.comments_count} comentários
        </button>
      )}

      {openComments && <CommentsModal postId={post.id} meId={meId} onClose={() => setOpenComments(false)} />}
      {reportOpen && <ReportDialog kind="post" targetId={post.id} targetLabel={`o post de @${post.author.username}`} onClose={() => setReportOpen(false)} />}
      {repostOpen && (
        <RepostDialog
          originalPostId={post.original_post_id ?? post.id}
          originalMediaUrl={sourceUrls[0]}
          originalMediaType={sourceTypes[0]}
          originalCaption={post.original?.caption ?? post.caption}
          originalAuthorName={post.original?.author?.display_name ?? post.author.display_name}
          onClose={() => setRepostOpen(false)}
        />
      )}
      {editOpen && <EditPostDialog postId={post.id} initialCaption={post.caption} onClose={() => setEditOpen(false)} />}
    </article>
  );
}

function menuItem(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 12px",
    width: "100%",
    background: "transparent",
    border: "none",
    color,
    fontWeight: 600,
    fontSize: 13.5,
    cursor: "pointer",
    textAlign: "left",
    borderRadius: 6
  };
}
