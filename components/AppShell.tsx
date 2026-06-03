import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import { Flame } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function AppShell({
  children,
  right,
  wide = false
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  /** Quando true (admin), o center se expande até preencher o espaço; sem right aside */
  wide?: boolean;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let me: Profile | null = null;
  let unreadNotifs = 0;
  let unreadMessages = 0;
  let unrevealedCrushers = 0;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    me = data ?? null;
    const [{ data: nCount }, { data: mCount }, { data: cCount }] = await Promise.all([
      supabase.rpc("unread_notifications_count"),
      supabase.rpc("unread_messages_count"),
      supabase.rpc("unrevealed_crushers_count")
    ]);
    unreadNotifs = typeof nCount === "number" ? nCount : 0;
    unreadMessages = typeof mCount === "number" ? mCount : 0;
    unrevealedCrushers = typeof cCount === "number" ? cCount : 0;
  }

  // No modo "wide" (admin) o conteúdo central usa quase toda a largura disponível.
  // No modo normal (feed) o conteúdo central fica centralizado em coluna estilo Instagram.
  const innerMaxWidth = wide ? 1400 : 680;
  const showRight = !wide && !!right;

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar me={me} unreadNotifs={unreadNotifs} unreadMessages={unreadMessages} unrevealedCrushers={unrevealedCrushers} />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 0 90px"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: innerMaxWidth,
            minWidth: 0,
            borderLeft: wide ? "none" : "1px solid rgba(255,255,255,0.08)",
            borderRight: wide ? "none" : "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <div
            className="md:hidden flex"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "rgba(13,13,15,0.85)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--border)",
              padding: "12px 16px",
              alignItems: "center",
              gap: 10
            }}
          >
            <MobileMenuDrawer
              me={me}
              unreadNotifs={unreadNotifs}
              unreadMessages={unreadMessages}
              unrevealedCrushers={unrevealedCrushers}
            />
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit", flex: 1, justifyContent: "center" }}>
              <Flame size={22} color="#FF1B6B" fill="#FF1B6B" />
              <span className="display" style={{ fontSize: 18 }}>
                FOGO NO <span style={{ color: "#FF1B6B" }}>BUTICO</span>
              </span>
            </Link>
            <div style={{ width: 28 }} />
          </div>

          {children}
        </div>
      </main>

      {showRight && (
        <aside
          className="hidden lg:flex"
          style={{
            width: 380,
            padding: "20px 18px 20px",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            flexShrink: 0,
            flexDirection: "column",
            borderLeft: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          {right}
        </aside>
      )}

      <BottomNav unreadNotifs={unreadNotifs} unreadMessages={unreadMessages} />
    </div>
  );
}
