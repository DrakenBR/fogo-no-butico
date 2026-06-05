"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Home, Search, MessageCircle, Heart, Bell, Trophy, Sparkles, HelpCircle, User,
  Bookmark, Pencil, LogOut, ShieldCheck, PlusCircle
} from "lucide-react";
import { Avatar } from "./Avatar";
import { useBadges } from "./BadgeProvider";
import { logout } from "@/app/login/actions";
import type { Profile } from "@/types/database";

interface Props {
  me: Profile | null;
  unreadNotifs?: number;
  unreadMessages?: number;
  unrevealedCrushers?: number;
}

export function MobileMenuDrawer({ me, unreadNotifs = 0, unreadMessages = 0, unrevealedCrushers = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  const live = useBadges();
  const nNotifs = live?.notifs ?? unreadNotifs;
  const nMessages = live?.messages ?? unreadMessages;
  const nCrushers = live?.crushers ?? unrevealedCrushers;

  useEffect(() => { setMounted(true); }, []);

  // fecha drawer ao mudar de rota
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // body scroll lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const items: { href: string; icon: typeof Home; label: string; badge?: number; tint?: string }[] = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/buscar", icon: Search, label: "Buscar" },
    { href: "/chat", icon: MessageCircle, label: "Chat", badge: nMessages },
    { href: "/notificacoes", icon: Bell, label: "Notificações", badge: nNotifs },
    { href: "/curtidas", icon: Heart, label: "Curtidas", badge: nCrushers },
    { href: "/surpresa", icon: Sparkles, label: "Roleta do Butico" },
    { href: "/trivia", icon: HelpCircle, label: "Trivia do dia" },
    { href: "/ranking", icon: Trophy, label: "Ranking" },
    { href: "/salvos", icon: Bookmark, label: "Salvos" },
    { href: "/perfil", icon: User, label: "Perfil" }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="abrir menu"
        style={{
          background: "none",
          border: "none",
          color: "var(--text)",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center"
        }}
      >
        <Menu size={24} />
      </button>

      {open && mounted && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-start"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(85vw, 320px)",
              height: "100%",
              background: "var(--bg)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              animation: "slideIn .18s ease"
            }}
          >
            {/* Header com user info */}
            <div
              style={{
                padding: "20px 18px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              {me ? (
                <>
                  <Avatar src={me.avatar_url} seed={me.username} initial={me.display_name} size={48} ring />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {me.display_name}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      @{me.username}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontWeight: 700 }}>FOGO NO BUTICO 🔥</div>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="fechar"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <Link
              href="/postar"
              className="fire-bg display"
              style={{
                margin: "14px 14px 6px",
                padding: "12px 14px",
                borderRadius: 14,
                color: "#fff",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                letterSpacing: 0.5
              }}
            >
              <PlusCircle size={18} /> POSTAR
            </Link>

            <nav style={{ display: "flex", flexDirection: "column", padding: "6px 8px", gap: 2 }}>
              {items.map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                const Icon = n.icon;
                const badge = (n.badge ?? 0) > 0;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      padding: "12px 12px",
                      borderRadius: 10,
                      background: active ? "rgba(255,27,107,0.12)" : "transparent",
                      color: active ? "#FF1B6B" : "var(--text)",
                      fontSize: 15,
                      fontWeight: 600,
                      textDecoration: "none"
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
                            border: "2px solid var(--bg)",
                            lineHeight: 1
                          }}
                        >
                          {(n.badge ?? 0) > 99 ? "99+" : n.badge}
                        </span>
                      )}
                    </span>
                    {n.label}
                  </Link>
                );
              })}

              {me?.is_admin && (
                <Link
                  href="/admin"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "12px 12px",
                    borderRadius: 10,
                    background: path.startsWith("/admin") ? "rgba(255,177,61,0.15)" : "rgba(255,177,61,0.06)",
                    color: "#FFB13D",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    marginTop: 8,
                    border: "1px solid rgba(255,177,61,0.3)"
                  }}
                >
                  <ShieldCheck size={18} /> ADMIN
                </Link>
              )}
            </nav>

            <div style={{ flex: 1 }} />

            {me && (
              <div style={{ padding: "8px 8px 18px", borderTop: "1px solid var(--border)", marginTop: 8 }}>
                <Link
                  href="/onboarding"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  <Pencil size={16} /> Editar perfil
                </Link>
                <form action={logout} style={{ margin: 0 }}>
                  <button
                    type="submit"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "#FF6A9E",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </form>
              </div>
            )}

            <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
