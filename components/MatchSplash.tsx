"use client";

import Link from "next/link";
import { Flame, X } from "lucide-react";
import { Avatar } from "./Avatar";

export function MatchSplash({
  meAvatar,
  meName,
  otherAvatar,
  otherName,
  conversationId,
  otherUsername,
  onClose
}: {
  meAvatar: string | null;
  meName: string;
  otherAvatar: string | null;
  otherName: string;
  conversationId: string | null;
  otherUsername: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, rgba(255,27,107,0.35) 0%, rgba(0,0,0,0.95) 65%)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadein .25s ease"
      }}
    >
      <button
        onClick={onClose}
        aria-label="fechar"
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          background: "rgba(0,0,0,0.4)",
          border: "none",
          color: "#fff",
          borderRadius: "50%",
          width: 36,
          height: 36,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <X size={18} />
      </button>

      <Flame size={56} color="#FF1B6B" fill="#FF1B6B" className="animate-pulse-fire" />
      <h2 className="display fire-text" style={{ fontSize: 56, margin: "14px 0 4px", letterSpacing: 2 }}>
        DEU FOGO!
      </h2>
      <p style={{ color: "#F5F5F7", fontSize: 17, opacity: 0.9, marginTop: 0, marginBottom: 28, textAlign: "center" }}>
        Vocês dois se curtiram. <span style={{ color: "#FF1B6B", fontWeight: 700 }}>Bota fogo no chat 🔥</span>
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 32 }}>
        <Avatar src={meAvatar} seed={meName} initial={meName} size={88} ring />
        <Flame size={32} color="#FF1B6B" fill="#FF1B6B" />
        <Avatar src={otherAvatar} seed={otherUsername} initial={otherName} size={88} ring />
      </div>

      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360 }}>
        <Link
          href={conversationId ? `/chat/${conversationId}` : "/chat"}
          onClick={onClose}
          className="fire-bg display"
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            color: "#fff",
            textDecoration: "none",
            fontSize: 15,
            letterSpacing: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          MANDAR MENSAGEM
        </Link>
        <button
          onClick={onClose}
          style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          Depois
        </button>
      </div>
    </div>
  );
}
