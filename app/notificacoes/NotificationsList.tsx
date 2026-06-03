"use client";

import Link from "next/link";
import { Flame, MessageCircle, AtSign, Bell } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { timeAgo, photoGradient } from "@/lib/utils";
import type { NotificationRow, NotificationKind } from "@/types/database";

export function NotificationsList({ rows }: { rows: NotificationRow[] }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#9A9AA0" }}>
        <Bell size={42} color="#9A9AA0" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
        <div style={{ fontSize: 15 }}>Nenhuma notificação ainda</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Bota fogo nos posts da galera pra começar a aparecer aqui</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {rows.map((n) => {
        const actor = n.actor!;
        const text = phraseFor(n.kind);
        const href = targetFor(n);

        return (
          <Link
            key={n.id}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 4px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              textDecoration: "none",
              color: "inherit",
              background: n.read_at ? "transparent" : "rgba(255,27,107,0.06)"
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar src={actor.avatar_url} seed={actor.username} initial={actor.display_name} size={44} />
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: "#0D0D0F",
                  border: "2px solid #0D0D0F",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <KindIcon kind={n.kind} />
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>{actor.display_name}</span>{" "}
                <span style={{ color: "#9A9AA0" }}>{text}</span>
              </div>
              {n.comment?.body && (
                <div
                  style={{
                    color: "#9A9AA0",
                    fontSize: 12.5,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  &quot;{n.comment.body}&quot;
                </div>
              )}
              <div style={{ color: "#9A9AA0", fontSize: 11.5, marginTop: 2 }}>{timeAgo(n.created_at)}</div>
            </div>

            {n.post?.media_url && (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: photoGradient(n.post.id),
                  overflow: "hidden",
                  flexShrink: 0
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={n.post.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            {!n.read_at && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#FF1B6B",
                  flexShrink: 0
                }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function phraseFor(kind: NotificationKind): string {
  switch (kind) {
    case "fire_post": return "botou fogo no teu post 🔥";
    case "fire_comment": return "botou fogo no teu comentário 🔥";
    case "comment": return "comentou no teu post";
    case "mention": return "te mencionou num comentário";
  }
}

function targetFor(n: NotificationRow): string {
  if (n.post && n.actor) {
    return `/perfil/${n.actor.username}/posts/${n.post.id}`;
  }
  if (n.actor) return `/perfil/${n.actor.username}`;
  return "/";
}

function KindIcon({ kind }: { kind: NotificationKind }) {
  if (kind === "fire_post" || kind === "fire_comment") {
    return <Flame size={12} color="#FF1B6B" fill="#FF1B6B" />;
  }
  if (kind === "comment") return <MessageCircle size={12} color="#C49BFF" />;
  return <AtSign size={12} color="#FFB13D" />;
}
