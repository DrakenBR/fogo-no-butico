"use client";

import { Search, Home, Trophy, User, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", icon: Home, label: "Feed" },
  { href: "/buscar", icon: Search, label: "Buscar" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/perfil", icon: User, label: "Perfil" }
];

export function BottomNav() {
  const path = usePathname();
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
        borderTop: "1px solid rgba(255,255,255,0.08)",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0 14px",
        zIndex: 20
      }}
    >
      {items.slice(0, 2).map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "#FF1B6B" : "#9A9AA0", textDecoration: "none" }}
          >
            <Icon size={23} fill={active ? "#FF1B6B" : "none"} />
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{n.label}</span>
          </Link>
        );
      })}

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
          textDecoration: "none"
        }}
      >
        <PlusCircle size={26} />
      </Link>

      {items.slice(2).map((n) => {
        const active = path.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "#FF1B6B" : "#9A9AA0", textDecoration: "none" }}
          >
            <Icon size={23} fill={active ? "#FF1B6B" : "none"} />
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
