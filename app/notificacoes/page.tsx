import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { NotificationsList } from "./NotificationsList";
import type { NotificationRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notificacoes");

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id, kind, post_id, comment_id, read_at, created_at,
      actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url),
      post:posts!notifications_post_id_fkey(id, media_url, caption),
      comment:comments!notifications_comment_id_fkey(id, body)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = ((data ?? []) as unknown as NotificationRow[]).filter((n) => n.actor);

  // marca como lidas (não bloqueia o render)
  await supabase.rpc("mark_all_notifications_read");

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Bell size={24} color="#FF1B6B" />
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>
            NOTIFICAÇÕES
          </h1>
        </div>

        {error && (
          <div style={{ color: "#FF6A9E", padding: 12, fontSize: 13 }}>
            erro: {error.message}
          </div>
        )}

        <NotificationsList rows={rows} />
      </div>
    </AppShell>
  );
}
