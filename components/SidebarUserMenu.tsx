"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, LogOut, User } from "lucide-react";
import { Avatar } from "./Avatar";
import { logout } from "@/app/login/actions";
import type { Profile } from "@/types/database";

export function SidebarUserMenu({ me }: { me: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", marginTop: "auto" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 8,
          borderRadius: 12,
          background: open ? "rgba(255,27,107,0.10)" : "transparent",
          border: "1px solid transparent",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
          transition: "background .12s ease"
        }}
      >
        <Avatar src={me.avatar_url} seed={me.username} initial={me.display_name} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {me.display_name}
          </div>
          <div style={{ color: "#9A9AA0", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            @{me.username}
          </div>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#1E1C22",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            zIndex: 30
          }}
        >
          <Link
            href={`/perfil/${me.username}`}
            onClick={() => setOpen(false)}
            role="menuitem"
            style={item}
          >
            <User size={16} /> Ver perfil
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setOpen(false)}
            role="menuitem"
            style={item}
          >
            <Pencil size={16} /> Editar perfil
          </Link>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 6px" }} />
          <form action={logout} style={{ margin: 0 }}>
            <button
              type="submit"
              role="menuitem"
              style={{ ...item, color: "#FF6A9E", border: "none", background: "transparent", width: "100%", cursor: "pointer" }}
            >
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const item: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "#F5F5F7",
  fontSize: 14,
  fontWeight: 600
};
