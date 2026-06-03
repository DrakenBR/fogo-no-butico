import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { RoletaUI } from "./RoletaUI";

export const dynamic = "force-dynamic";

export default async function SurpresaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/surpresa");

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Flame size={26} color="#FF1B6B" fill="#FF1B6B" />
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>
            ROLETA DO <span style={{ color: "#FF1B6B" }}>BUTICO</span>
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", marginTop: 0, marginBottom: 24 }}>
          Gira a roleta e descobre um butico aleatório 🎲🔥
        </p>
        <RoletaUI />
      </div>
    </AppShell>
  );
}
