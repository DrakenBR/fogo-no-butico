"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { createClient } from "@/lib/supabase/client";

interface Match {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  style?: React.CSSProperties;
  excludeUserId?: string | null;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength = 500,
  style,
  excludeUserId
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Match[]>([]);
  const [highlight, setHighlight] = useState(0);

  // descobre se o cursor tá em um @mencao, devolve a query e o ponto onde colar
  const getCtx = (): { start: number; query: string } | null => {
    const el = inputRef.current;
    if (!el) return null;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/(?:^|\s)@([a-z0-9_]{0,24})$/i);
    if (!match) return null;
    return {
      start: before.length - match[1].length - 1,
      query: match[1]
    };
  };

  // busca sugestões quando o value muda
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) {
      setSuggestions([]);
      return;
    }
    const supabase = createClient();
    let canceled = false;
    (async () => {
      let q = supabase.from("profiles").select("id, username, display_name, avatar_url").limit(6);
      if (ctx.query.trim()) {
        const term = ctx.query.replace(/[%_]/g, "");
        q = q.ilike("username", `${term}%`);
      } else {
        q = q.order("created_at", { ascending: false });
      }
      const { data } = await q;
      if (canceled) return;
      let rows = (data ?? []) as Match[];
      if (excludeUserId) rows = rows.filter((r) => r.id !== excludeUserId);
      setSuggestions(rows);
      setHighlight(0);
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const applyMention = (u: Match) => {
    const ctx = getCtx();
    if (!ctx) return;
    const before = value.slice(0, ctx.start);
    const after = value.slice(ctx.start + 1 + ctx.query.length);
    const next = `${before}@${u.username} ${after}`;
    onChange(next);
    setSuggestions([]);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        const pos = before.length + u.username.length + 2;
        el.setSelectionRange(pos, pos);
        el.focus();
      }
    }, 0);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyMention(suggestions[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSuggestions([]);
        return;
      }
    }
    if (e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {suggestions.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#1E1C22",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            padding: 4,
            zIndex: 60,
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            maxHeight: 260,
            overflowY: "auto"
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyMention(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: i === highlight ? "rgba(255,27,107,0.15)" : "transparent",
                border: "none",
                color: "#F5F5F7",
                width: "100%",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <Avatar src={s.avatar_url} seed={s.username} initial={s.display_name} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.display_name}
                </div>
                <div style={{ color: "#9A9AA0", fontSize: 12 }}>@{s.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        maxLength={maxLength}
        style={style}
      />
    </div>
  );
}
