"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Send, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/utils";
import type { GroupMessage } from "@/types/database";

interface Member {
  user_id: string;
  is_admin: boolean;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export function GroupThread({
  groupId,
  groupName,
  groupAvatar,
  meId,
  members,
  initialMessages
}: {
  groupId: string;
  groupName: string;
  groupAvatar: string | null;
  meId: string;
  members: Member[];
  initialMessages: GroupMessage[];
}) {
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const profileById: Record<string, Member["profile"]> = {};
  for (const m of members) profileById[m.user_id] = m.profile;

  // realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:group:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const m = payload.new as GroupMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const m = payload.old as GroupMessage;
          setMessages((prev) => prev.filter((x) => x.id !== m.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // marca como lido no mount e sempre que recebe nova msg
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("mark_group_read", { g: groupId }).then(() => {});
  }, [groupId, messages.length]);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    const optimistic: GroupMessage = {
      id: `tmp-${Date.now()}`,
      group_id: groupId,
      sender_id: meId,
      body: text,
      created_at: new Date().toISOString()
    };
    setMessages((p) => [...p, optimistic]);
    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_messages")
        .insert({ group_id: groupId, sender_id: meId, body: text })
        .select("id, group_id, sender_id, body, created_at")
        .single();
      if (error) {
        setMessages((p) => p.filter((m) => m.id !== optimistic.id));
        setBody(text);
        return;
      }
      if (data) {
        setMessages((p) => p.map((m) => (m.id === optimistic.id ? (data as GroupMessage) : m)));
      }
      inputRef.current?.focus();
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "rgba(13,13,15,0.92)",
          backdropFilter: "blur(12px)",
          zIndex: 5
        }}
      >
        <Link
          href="/chat"
          aria-label="voltar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            color: "var(--text)",
            textDecoration: "none"
          }}
        >
          <ArrowLeft size={20} />
        </Link>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: groupAvatar
              ? `center/cover no-repeat url(${groupAvatar})`
              : "linear-gradient(135deg, #7A1FFF 0%, #FF1B6B 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0
          }}
        >
          {!groupAvatar && <Users size={18} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            {groupName}
            <span style={{ fontSize: 10, color: "#C49BFF", border: "1px solid #C49BFF55", padding: "1px 5px", borderRadius: 999, fontWeight: 700 }}>
              GRUPO
            </span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{members.length} membros</div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
            Quebra o gelo 🔥 manda a primeira mensagem.
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === meId;
          const prev = messages[i - 1];
          const showAvatar = !mine && (!prev || prev.sender_id !== m.sender_id);
          const showName = !mine && showAvatar;
          const author = profileById[m.sender_id];
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: 8,
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "78%",
                alignItems: "flex-end"
              }}
            >
              {!mine && showAvatar && (
                <Link href={author ? `/perfil/${author.username}` : "#"}>
                  <Avatar src={author?.avatar_url} seed={author?.username} initial={author?.display_name} size={28} />
                </Link>
              )}
              {!mine && !showAvatar && <div style={{ width: 28 }} />}
              <div
                style={{
                  background: mine ? "linear-gradient(135deg, #FF1B6B 0%, #FF6A3D 100%)" : "var(--bubble-other)",
                  color: mine ? "#fff" : "var(--text)",
                  padding: "9px 13px",
                  borderRadius: 16,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                  fontSize: 14.5,
                  lineHeight: 1.35,
                  wordBreak: "break-word"
                }}
              >
                {showName && author && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C49BFF", marginBottom: 2 }}>
                    {author.display_name}
                  </div>
                )}
                {m.body}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: mine ? "right" : "left" }}>
                  {timeAgo(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 14px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)"
        }}
      >
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mensagem pro grupo..."
          maxLength={2000}
          style={{
            flex: 1,
            background: "var(--surface-up)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "11px 16px",
            color: "var(--text)",
            fontSize: 14,
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="fire-bg"
          style={{
            border: "none",
            borderRadius: "50%",
            width: 42,
            height: 42,
            minWidth: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: !body.trim() ? "not-allowed" : "pointer",
            opacity: !body.trim() ? 0.5 : 1,
            color: "#fff"
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
