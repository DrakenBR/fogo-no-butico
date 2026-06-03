import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Flame } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function AppShell({
  children,
  right
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let me: Profile | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    me = data ?? null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar me={me} />

      <main
        style={{
          flex: 1,
          maxWidth: 600,
          margin: "0 auto",
          padding: "0 0 90px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          minWidth: 0
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
      </main>

      <aside
        className="hidden lg:block"
        style={{
          width: 320,
          padding: "26px 20px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          flexShrink: 0
        }}
      >
        {right}
      </aside>

      <BottomNav />
    </div>
  );
}
