import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/utils";
import type { MatchSummary } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/chat");

  const { data } = await supabase.rpc("my_matches");
  const matches = ((data ?? []) as unknown as MatchSummary[]);

  return (
    <AppShell>
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <Flame size={24} color="#FF1B6B" fill="#FF1B6B" />
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>CHAT</h1>
        </div>
      </div>

      {matches.length === 0 ? (
        <div style={{ padding: "60px 22px", textAlign: "center", color: "#9A9AA0" }}>
          <Flame size={42} color="#FF1B6B" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <div style={{ fontSize: 15 }}>Nenhum match ainda</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Quando alguém te curtir de volta, vai aparecer aqui</div>
        </div>
      ) : (
        <div>
          {matches.map((m) => (
            <Link
              key={m.conversation_id}
              href={`/chat/${m.conversation_id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <Avatar src={m.other_avatar_url} seed={m.other_username} initial={m.other_display_name} size={52} ring={!m.last_message_at} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{m.other_display_name}</span>
                  {!m.last_message_at && (
                    <span style={{ fontSize: 10.5, color: "#FF1B6B", border: "1px solid #FF1B6B", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>
                      NOVO MATCH
                    </span>
                  )}
                </div>
                <div style={{ color: m.unread_count > 0 ? "#F5F5F7" : "#9A9AA0", fontSize: 13.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: m.unread_count > 0 ? 600 : 400 }}>
                  {m.last_message_body
                    ? `${m.last_message_sender === m.other_id ? "" : "Você: "}${m.last_message_body}`
                    : "Bota fogo no chat 🔥"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ color: "#9A9AA0", fontSize: 11.5 }}>
                  {timeAgo(m.last_message_at ?? m.matched_at)}
                </span>
                {m.unread_count > 0 && (
                  <span style={{ background: "#FF1B6B", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999, minWidth: 18, textAlign: "center" }}>
                    {m.unread_count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
