import { redirect } from "next/navigation";
import { Flame, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CrushersList } from "./CrushersList";
import type { CrusherPreview } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CurtidasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/curtidas");

  const { data } = await supabase.rpc("my_crushers");
  const rows = (data ?? []) as CrusherPreview[];
  const matches = rows.filter((r) => r.is_match);
  const unrevealed = rows.filter((r) => !r.is_match);

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <Flame size={26} color="#FF1B6B" fill="#FF1B6B" />
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>
            QUEM TE <span style={{ color: "#FF1B6B" }}>CURTIU</span>
          </h1>
        </div>
        <p style={{ color: "#9A9AA0", marginTop: -8, marginBottom: 24 }}>
          Você tem <span style={{ color: "#FF1B6B", fontWeight: 700 }}>{unrevealed.length}</span> butico{unrevealed.length === 1 ? "" : "s"} secreto{unrevealed.length === 1 ? "" : "s"} de fogo 🔥
        </p>

        {matches.length > 0 && (
          <>
            <div style={{ color: "#FFB13D", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={13} /> JÁ DEU FOGO
            </div>
            <CrushersList rows={matches} revealed />
            <div style={{ height: 24 }} />
          </>
        )}

        <div style={{ color: "#9A9AA0", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
          NÃO REVELADOS
        </div>
        {unrevealed.length === 0 ? (
          <div style={{ color: "#9A9AA0", padding: 30, textAlign: "center" }}>
            Ninguém te curtiu em segredo ainda. Posta mais 🔥
          </div>
        ) : (
          <CrushersList rows={unrevealed} revealed={false} />
        )}
      </div>
    </AppShell>
  );
}
