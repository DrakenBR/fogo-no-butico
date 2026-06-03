import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
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
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    me = data ?? null;
  }

  // No modo "wide" (admin) o conteúdo central usa quase toda a largura disponível.
  // No modo normal (feed) o conteúdo central fica centralizado em coluna estilo Instagram.
  const innerMaxWidth = wide ? 1400 : 680;
  const showRight = !wide && !!right;

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar me={me} />

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
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              padding: "14px 18px",
              alignItems: "center",
              gap: 8
            }}
          >
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
              <Flame size={24} color="#FF1B6B" fill="#FF1B6B" />
              <span className="display" style={{ fontSize: 20 }}>
                FOGO NO <span style={{ color: "#FF1B6B" }}>BUTICO</span>
              </span>
            </Link>
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

      <BottomNav />
    </div>
  );
}
