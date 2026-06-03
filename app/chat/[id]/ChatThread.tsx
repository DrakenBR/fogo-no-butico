"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Send, SmilePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/utils";
import type { Message, MessageReaction } from "@/types/database";

const QUICK_EMOJIS = ["🔥", "❤️", "😂", "😮", "😢", "🙏"];

interface Other {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
}

export function ChatThread({
  conversationId,
  meId,
  other,
  initialMessages
}: {
  conversationId: string;
  meId: string;
  other: Other;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // load reactions
  useEffect(() => {
    if (messages.length === 0) return;
    const supabase = createClient();
    let canceled = false;
    (async () => {
      const ids = messages.map((m) => m.id).filter((id) => !id.startsWith("tmp-"));
      if (ids.length === 0) return;
      const { data } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", ids);
      if (!canceled) setReactions((data ?? []) as MessageReaction[]);
    })();
    return () => {
      canceled = true;
    };
  }, [messages.length]);

  // realtime: novos / updates + reactions
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:chat:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.new as MessageReaction;
          setReactions((prev) =>
            prev.some((x) => x.message_id === r.message_id && x.user_id === r.user_id) ? prev : [...prev, r]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.new as MessageReaction;
          setReactions((prev) =>
            prev.map((x) => (x.message_id === r.message_id && x.user_id === r.user_id ? r : x))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.old as MessageReaction;
          setReactions((prev) => prev.filter((x) => !(x.message_id === r.message_id && x.user_id === r.user_id)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const toggleReaction = (messageId: string, emoji: string) => {
    setPickerFor(null);
    const mine = reactions.find((r) => r.message_id === messageId && r.user_id === meId);
    const supabase = createClient();
    if (mine && mine.emoji === emoji) {
      // remove
      setReactions((prev) => prev.filter((r) => !(r.message_id === messageId && r.user_id === meId)));
      supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", meId);
    } else {
      // upsert
      setReactions((prev) => {
        const filtered = prev.filter((r) => !(r.message_id === messageId && r.user_id === meId));
        return [...filtered, { message_id: messageId, user_id: meId, emoji, created_at: new Date().toISOString() }];
      });
      supabase
        .from("message_reactions")
        .upsert({ message_id: messageId, user_id: meId, emoji }, { onConflict: "message_id,user_id" });
    }
  };

  // marca todas as msgs do outro como lidas no mount + sempre que chegam novas
  useEffect(() => {
    const supabase = createClient();
    const unreadFromOther = messages.filter((m) => m.sender_id === other.id && !m.read_at);
    if (unreadFromOther.length === 0) return;
    (async () => {
      const ids = unreadFromOther.map((m) => m.id);
      await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", ids);
    })();
  }, [messages, other.id]);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    // optimistic
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: meId,
      body: text,
      read_at: null,
      created_at: new Date().toISOString()
    };
    setMessages((p) => [...p, optimistic]);

    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: meId, body: text })
        .select("id, conversation_id, sender_id, body, read_at, created_at")
        .single();
      if (error) {
        // rollback
        setMessages((p) => p.filter((m) => m.id !== optimistic.id));
        setBody(text);
        return;
      }
      // troca o optimistic pelo real
      if (data) {
        setMessages((p) => p.map((m) => (m.id === optimistic.id ? (data as Message) : m)));
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
          borderBottom: "1px solid rgba(255,255,255,0.08)",
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
            color: "#F5F5F7",
            textDecoration: "none"
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <Link
          href={`/perfil/${other.username}`}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}
        >
          <Avatar src={other.avatar_url} seed={other.username} initial={other.display_name} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{other.display_name}</div>
            <div style={{ color: "#9A9AA0", fontSize: 12 }}>@{other.username}{other.city ? ` · ${other.city}` : ""}</div>
          </div>
        </Link>
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
          <div style={{ textAlign: "center", color: "#9A9AA0", padding: 40 }}>
            Vocês deram fogo um no outro 🔥<br />
            Manda a primeira mensagem!
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === meId;
          const prev = messages[i - 1];
          const showAvatar = !mine && (!prev || prev.sender_id !== m.sender_id);
          const msgReactions = reactions.filter((r) => r.message_id === m.id);
          const reactionGroups = msgReactions.reduce<Record<string, number>>((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
            return acc;
          }, {});
          const myReaction = msgReactions.find((r) => r.user_id === meId)?.emoji;

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: 8,
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "78%",
                alignItems: "flex-end",
                position: "relative"
              }}
              onMouseLeave={() => pickerFor === m.id && setPickerFor(null)}
            >
              {!mine && showAvatar && (
                <Avatar src={other.avatar_url} seed={other.username} initial={other.display_name} size={28} />
              )}
              {!mine && !showAvatar && <div style={{ width: 28 }} />}

              <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                {/* Bolha + botão emoji que aparece no hover */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: mine ? "row-reverse" : "row" }}
                  onMouseEnter={(e) => {
                    if (!m.id.startsWith("tmp-")) {
                      e.currentTarget.querySelector<HTMLButtonElement>(".react-btn")?.style.setProperty("opacity", "1");
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector<HTMLButtonElement>(".react-btn")?.style.setProperty("opacity", "0");
                  }}
                >
                  <div
                    style={{
                      background: mine ? "linear-gradient(135deg, #FF1B6B 0%, #FF6A3D 100%)" : "#1E1C22",
                      color: mine ? "#fff" : "#F5F5F7",
                      padding: "9px 13px",
                      borderRadius: 16,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                      fontSize: 14.5,
                      lineHeight: 1.35,
                      wordBreak: "break-word"
                    }}
                  >
                    {m.body}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: mine ? "right" : "left" }}>
                      {timeAgo(m.created_at)}
                      {mine && m.read_at ? " · visto" : ""}
                    </div>
                  </div>

                  <button
                    className="react-btn"
                    onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                    aria-label="reagir"
                    style={{
                      opacity: 0,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      cursor: "pointer",
                      color: "#9A9AA0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "opacity .15s ease",
                      flexShrink: 0
                    }}
                  >
                    <SmilePlus size={14} />
                  </button>
                </div>

                {/* Picker */}
                {pickerFor === m.id && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: mine ? "auto" : 0,
                      right: mine ? 0 : "auto",
                      marginBottom: 4,
                      display: "flex",
                      gap: 4,
                      padding: 6,
                      background: "#1E1C22",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 999,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
                      zIndex: 10
                    }}
                  >
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(m.id, emoji)}
                        style={{
                          background: myReaction === emoji ? "rgba(255,27,107,0.18)" : "transparent",
                          border: "none",
                          borderRadius: "50%",
                          width: 30,
                          height: 30,
                          fontSize: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reações já dadas */}
                {Object.keys(reactionGroups).length > 0 && (
                  <div style={{ display: "flex", gap: 4, alignSelf: mine ? "flex-end" : "flex-start" }}>
                    {Object.entries(reactionGroups).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(m.id, emoji)}
                        style={{
                          background: myReaction === emoji ? "rgba(255,27,107,0.18)" : "rgba(255,255,255,0.05)",
                          border: myReaction === emoji ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 999,
                          padding: "1px 7px",
                          color: "#F5F5F7",
                          fontSize: 12,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{emoji}</span>
                        {count > 1 && <span style={{ color: "#9A9AA0", fontSize: 11 }}>{count}</span>}
                      </button>
                    ))}
                  </div>
                )}
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
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "#0D0D0F"
        }}
      >
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mensagem..."
          maxLength={2000}
          style={{
            flex: 1,
            background: "#1E1C22",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "11px 16px",
            color: "#F5F5F7",
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
