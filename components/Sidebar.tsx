"use client";

import { Flame, Search, Home, Trophy, User, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import type { Profile } from "@/types/database";

const items = [
  { href: "/", icon: Home, label: "Feed" },
  { href: "/buscar", icon: Search, label: "Buscar" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/perfil", icon: User, label: "Perfil" }
];

export function Sidebar({ me }: { me: Profile | null }) {
  const path = usePathname();
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

      <Link href="/buscar" style={{ display: "flex", alignItems: "center", gap: 8, background: "#161519", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px", marginBottom: 14, textDecoration: "none" }}>
        <Search size={17} color="#9A9AA0" />
        <span style={{ color: "#9A9AA0", fontSize: 14 }}>Buscar butico...</span>
      </Link>

      {items.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        const Icon = n.icon;
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
              color: active ? "#FF1B6B" : "#F5F5F7",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            <Icon size={20} fill={active ? "#FF1B6B" : "none"} /> {n.label}
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

      {me && (
        <Link href="/perfil" style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: 8, textDecoration: "none", color: "inherit" }}>
          <Avatar src={me.avatar_url} seed={me.username} initial={me.display_name} size={38} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{me.display_name}</div>
            <div style={{ color: "#9A9AA0", fontSize: 12 }}>@{me.username}</div>
          </div>
        </Link>
      )}
    </aside>
  );
}
