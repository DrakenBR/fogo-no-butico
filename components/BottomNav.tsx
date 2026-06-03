"use client";

import { Search, Home, MessageCircle, User, PlusCircle, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  unreadNotifs?: number;
  unreadMessages?: number;
}

export function BottomNav({ unreadNotifs = 0, unreadMessages = 0 }: Props) {
  const path = usePathname();

  const left = [
    { href: "/", icon: Home, label: "Feed", count: 0 },
    { href: "/chat", icon: MessageCircle, label: "Chat", count: unreadMessages }
  ];
  const right = [
    { href: "/notificacoes", icon: Bell, label: "Notif.", count: unreadNotifs },
    { href: "/perfil", icon: User, label: "Perfil", count: 0 }
  ];

  const renderItem = (n: { href: string; icon: typeof Home; label: string; count: number }) => {
    const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
    const Icon = n.icon;
    const hasBadge = n.count > 0;
    return (
      <Link
        key={n.href}
        href={n.href}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "#FF1B6B" : "var(--text-muted)", textDecoration: "none", padding: "4px 12px", minWidth: 56 }}
      >
        <span style={{ position: "relative", display: "inline-flex" }}>
          <Icon size={23} fill={active ? "#FF1B6B" : "none"} />
          {hasBadge && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -10,
                background: "#FF1B6B",
                color: "#fff",
                fontSize: 9.5,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 999,
                minWidth: 16,
                height: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--bg)",
                lineHeight: 1
              }}
            >
              {n.count > 99 ? "99+" : n.count}
            </span>
          )}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 600 }}>{n.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="md:hidden flex"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(13,13,15,0.92)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid var(--border)",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0 14px",
        zIndex: 20
      }}
    >
      {left.map(renderItem)}

      <Link
        href="/postar"
        className="fire-bg animate-glow"
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          marginTop: -22,
          textDecoration: "none",
          flexShrink: 0
        }}
        aria-label="postar"
      >
        <PlusCircle size={26} />
      </Link>

      {right.map(renderItem)}
    </nav>
  );
}
