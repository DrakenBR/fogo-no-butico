import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, Users, MessageCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { NewGroupButton } from "./NewGroupButton";
import { timeAgo } from "@/lib/utils";
import type { ChatRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/chat");

  const { data } = await supabase.rpc("my_chats");
  const rows = ((data ?? []) as unknown as ChatRow[]);

  return (
    <AppShell>
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Flame size={24} color="#FF1B6B" fill="#FF1B6B" />
            <h1 className="display" style={{ fontSize: 28, margin: 0 }}>CHAT</h1>
          </div>
          <NewGroupButton meId={user.id} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "60px 22px", textAlign: "center", color: "var(--text-muted)" }}>
          <Flame size={42} color="#FF1B6B" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <div style={{ fontSize: 15 }}>Nenhum chat ainda</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Quando alguém te curtir de volta vai aparecer aqui, ou cria um grupo de butico
          </div>
        </div>
      ) : (
        <div>
          {rows.map((r) => {
            const isGroup = r.kind === "group";
            const href = isGroup ? `/chat/g/${r.chat_id}` : `/chat/${r.chat_id}`;
            return (
              <Link
                key={`${r.kind}-${r.chat_id}`}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 22px",
                  borderBottom: "1px solid var(--border-soft-3)",
                  textDecoration: "none",
                  color: "inherit"
                }}
              >
                {isGroup ? (
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: r.avatar_url
                        ? `center/cover no-repeat url(${r.avatar_url})`
                        : "linear-gradient(135deg, #7A1FFF 0%, #FF1B6B 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff"
                    }}
                  >
                    {!r.avatar_url && <Users size={22} />}
                  </div>
                ) : (
                  <Avatar src={r.avatar_url} seed={r.chat_id} initial={r.title} size={52} ring={!r.last_at} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.title}
                    </span>
                    {isGroup && (
                      <span style={{ fontSize: 10, color: "#C49BFF", border: "1px solid #C49BFF55", padding: "1px 6px", borderRadius: 999, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <Users size={10} /> GRUPO
                      </span>
                    )}
                  </div>
                  <div style={{ color: r.unread_count > 0 ? "var(--text)" : "var(--text-muted)", fontSize: 13.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: r.unread_count > 0 ? 600 : 400 }}>
                    {r.last_body
                      ? (r.last_sender_id && r.last_sender_id !== user.id && !isGroup ? "" : "Você: ") + r.last_body
                      : (isGroup ? r.subtitle : "Bota fogo no chat 🔥")}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span style={{ color: "var(--text-muted)", fontSize: 11.5 }}>{timeAgo(r.last_at)}</span>
                  {r.unread_count > 0 && (
                    <span style={{ background: "#FF1B6B", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999, minWidth: 18, textAlign: "center" }}>
                      {r.unread_count}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
