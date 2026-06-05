"use client";

import { Flame, Search, Home, Trophy, User, PlusCircle, ShieldCheck, Bell, MessageCircle, Heart, Sparkles, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { useBadges } from "./BadgeProvider";
import type { Profile } from "@/types/database";

type BadgeKind = "notif" | "chat" | "crush" | null;

const items: { href: string; icon: typeof Home; label: string; badge?: BadgeKind }[] = [
  { href: "/", icon: Home, label: "Feed" },
  { href: "/buscar", icon: Search, label: "Buscar" },
  { href: "/surpresa", icon: Sparkles, label: "Roleta" },
  { href: "/trivia", icon: HelpCircle, label: "Trivia" },
  { href: "/chat", icon: MessageCircle, label: "Chat", badge: "chat" },
  { href: "/curtidas", icon: Heart, label: "Curtidas", badge: "crush" },
  { href: "/notificacoes", icon: Bell, label: "Notificações", badge: "notif" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/perfil", icon: User, label: "Perfil" }
];

export function Sidebar({
  me,
  unreadNotifs = 0,
  unreadMessages = 0,
  unrevealedCrushers = 0
}: {
  me: Profile | null;
  unreadNotifs?: number;
  unreadMessages?: number;
  unrevealedCrushers?: number;
}) {
  const path = usePathname();
  const live = useBadges();
  const notifs = live?.notifs ?? unreadNotifs;
  const messages = live?.messages ?? unreadMessages;
  const crushers = live?.crushers ?? unrevealedCrushers;
  return (
    <aside
      className="hidden md:flex"
      style={{
        width: 250,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "26px 18px",
        flexDirection: "column",
        gap: 8,
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26, paddingLeft: 6, textDecoration: "none", color: "inherit" }}>
        <Flame size={30} color="#FF1B6B" fill="#FF1B6B" />
        <div className="display" style={{ fontSize: 22, lineHeight: 0.95 }}>
          FOGO NO<br /><span style={{ color: "#FF1B6B" }}>BUTICO</span>
        </div>
      </Link>

      <Link href="/buscar" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px", marginBottom: 14, textDecoration: "none" }}>
        <Search size={17} color="var(--text-muted)" />
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Buscar butico...</span>
      </Link>

      {items.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        const Icon = n.icon;
        const count =
          n.badge === "notif" ? notifs :
          n.badge === "chat" ? messages :
          n.badge === "crush" ? crushers : 0;
        const badge = !!n.badge && count > 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "12px 14px",
              borderRadius: 12,
              background: active ? "rgba(255,27,107,0.12)" : "transparent",
              color: active ? "#FF1B6B" : "var(--text)",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              position: "relative"
            }}
          >
            <span style={{ position: "relative", display: "inline-flex" }}>
              <Icon size={20} fill={active ? "#FF1B6B" : "none"} />
              {badge && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    background: "#FF1B6B",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 999,
                    minWidth: 16,
                    height: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #0D0D0F",
                    lineHeight: 1
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            {n.label}
          </Link>
        );
      })}

      <Link
        href="/postar"
        className="fire-bg display"
        style={{
          marginTop: 16,
          padding: 13,
          borderRadius: 14,
          color: "#fff",
          fontSize: 17,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textDecoration: "none"
        }}
      >
        <PlusCircle size={20} /> POSTAR
      </Link>

      {me?.is_admin && (
        <Link
          href="/admin"
          style={{
            marginTop: 10,
            padding: "11px 14px",
            borderRadius: 12,
            background: path.startsWith("/admin") ? "rgba(255,177,61,0.15)" : "rgba(255,177,61,0.06)",
            border: "1px solid rgba(255,177,61,0.3)",
            color: "#FFB13D",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none"
          }}
        >
          <ShieldCheck size={16} /> ADMIN
        </Link>
      )}

      {me && <SidebarUserMenu me={me} />}
    </aside>
  );
}
