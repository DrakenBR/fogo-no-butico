import { redirect } from "next/navigation";
import { Users, Flame, MessageCircle, Camera, Sparkles, Activity, ShieldCheck, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/admin/KpiCard";
import { UsersAdminTable } from "@/components/admin/UsersAdminTable";
import { PostsAdminTable } from "@/components/admin/PostsAdminTable";
import { ReportsAdminTable } from "@/components/admin/ReportsAdminTable";
import type { AdminKpis } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase.from("profiles").select("id, is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) redirect("/");

  const { data: kpisRaw } = await supabase.rpc("admin_kpis");
  const k = (kpisRaw ?? {}) as AdminKpis;

  return (
    <AppShell wide>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={26} color="#FFB13D" />
          <h1 className="display" style={{ fontSize: 32, margin: 0 }}>
            ADMIN <span className="fire-text">CONTROL</span>
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", marginTop: 0, marginBottom: 26 }}>
          KPIs, gestão de usuários e moderação de posts
        </p>

        <h2 className="display" style={{ fontSize: 18, marginBottom: 12 }}>VISÃO GERAL</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 32
          }}
        >
          <KpiCard label="Usuários" value={k.users_total ?? 0} sub={`+${k.users_last_24h ?? 0} em 24h`} icon={Users} />
          <KpiCard label="Ativos 24h" value={k.active_users_24h ?? 0} sub={`${k.users_last_7d ?? 0} novos 7d`} icon={Activity} accent="#FFB13D" />
          <KpiCard label="Posts" value={k.posts_total ?? 0} sub={`+${k.posts_last_24h ?? 0} em 24h`} icon={Camera} />
          <KpiCard label="Fogos" value={k.fires_total ?? 0} sub={`+${k.fires_last_24h ?? 0} em 24h`} icon={Flame} />
          <KpiCard label="Comentários" value={k.comments_total ?? 0} sub={`+${k.comments_last_24h ?? 0} em 24h`} icon={MessageCircle} accent="#C49BFF" />
          <KpiCard label="Stories ativos" value={k.stories_active ?? 0} sub={`${k.stories_total ?? 0} totais`} icon={Sparkles} accent="#FFB13D" />
          <KpiCard label="Admins" value={k.admins_total ?? 0} sub="" icon={ShieldCheck} accent="#FFB13D" />
          <KpiCard label="Novos 7d" value={k.users_last_7d ?? 0} icon={UserPlus} accent="#C49BFF" />
        </div>

        <div style={{ marginBottom: 36 }}>
          <ReportsAdminTable />
        </div>

        <div style={{ marginBottom: 36 }}>
          <UsersAdminTable meId={user.id} />
        </div>

        <PostsAdminTable />
      </div>
    </AppShell>
  );
}
