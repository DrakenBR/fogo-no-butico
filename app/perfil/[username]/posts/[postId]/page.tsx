import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { ScrollToAnchor } from "@/components/ScrollToAnchor";
import { getFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params
}: {
  params: { username: string; postId: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", params.username)
    .maybeSingle();
  if (!profile) notFound();

  const { posts, meId } = await getFeed({ userId: profile.id, limit: 200 });
  if (!posts.find((p) => p.id === params.postId)) notFound();

  return (
    <AppShell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "rgba(13,13,15,0.85)",
          backdropFilter: "blur(12px)"
        }}
      >
        <Link
          href={`/perfil/${profile.username}`}
          aria-label="voltar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            color: "var(--text)",
            textDecoration: "none"
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <Link
          href={`/perfil/${profile.username}`}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}
        >
          <Avatar src={profile.avatar_url} seed={profile.username} initial={profile.display_name} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.display_name}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>@{profile.username} · {posts.length} {posts.length === 1 ? "post" : "posts"}</div>
          </div>
        </Link>
      </div>

      {posts.map((p) => (
        <div
          key={p.id}
          id={`post-${p.id}`}
          style={{ scrollMarginTop: 72 }}
        >
          <PostCard post={p} meId={meId} />
        </div>
      ))}

      <ScrollToAnchor id={`post-${params.postId}`} />
    </AppShell>
  );
}
