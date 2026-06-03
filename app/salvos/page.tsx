import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { photoGradient } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SalvosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/salvos");

  // Pega posts salvos, com info do autor pra construir link correto
  const { data: saved } = await supabase
    .from("saved_posts")
    .select("created_at, post_id, post:posts!saved_posts_post_id_fkey(id, media_url, media_type, caption, author:profiles!posts_user_id_fkey(username))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  const items = (saved ?? [])
    .map((s: any) => s.post)
    .filter(Boolean) as Array<{ id: string; media_url: string; media_type: string; caption: string | null; author: { username: string } | null }>;

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <Bookmark size={24} color="#FFB13D" fill="#FFB13D" />
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>SALVOS</h1>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "60px 22px", textAlign: "center", color: "var(--text-muted)" }}>
            <Bookmark size={42} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontSize: 15 }}>Nenhum post salvo ainda</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Clica no ícone de marcador num post pra guardar pra depois</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
            {items.map((p) => (
              <Link
                key={p.id}
                href={p.author ? `/perfil/${p.author.username}/posts/${p.id}` : "/"}
                style={{
                  aspectRatio: "1",
                  background: photoGradient(p.id),
                  overflow: "hidden",
                  display: "block",
                  position: "relative"
                }}
              >
                {p.media_type === "video" ? (
                  <video src={p.media_url} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
