import { AppShell } from "@/components/AppShell";
import { Fogueira } from "@/components/Fogueira";
import { PostCard } from "@/components/PostCard";
import { RankingPanel } from "@/components/RankingPanel";
import { getActiveStoryGroups, getFeed } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";
import { Flame } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ posts, meId }, groups, rankingData] = await Promise.all([
    getFeed({}),
    getActiveStoryGroups(),
    getRanking()
  ]);

  return (
    <AppShell right={<RankingPanel rows={rankingData.rows} myPosition={rankingData.myPosition} compact />}>
      <Fogueira groups={groups} meId={meId} />

      {posts.length === 0 ? (
        <EmptyFeed />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} meId={meId} />)
      )}
    </AppShell>
  );
}

async function getRanking() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("weekly_ranking")
    .select("*")
    .order("fires", { ascending: false })
    .limit(50);
  const rows = data ?? [];
  const myPosition = user ? rows.find((r) => r.user_id === user.id)?.position ?? null : null;
  return { rows, myPosition };
}

function EmptyFeed() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", color: "#9A9AA0" }}>
      <Flame size={56} color="#FF1B6B" style={{ margin: "0 auto 16px" }} />
      <div className="display" style={{ fontSize: 22, color: "#F5F5F7" }}>
        SEM POSTS AINDA
      </div>
      <p style={{ marginTop: 8, fontSize: 14 }}>
        Sê o primeiro a botar fogo no butico.
      </p>
      <Link
        href="/postar"
        className="fire-bg display"
        style={{
          display: "inline-block",
          marginTop: 18,
          padding: "12px 22px",
          borderRadius: 12,
          textDecoration: "none",
          color: "#fff",
          fontSize: 15
        }}
      >
        POSTAR AGORA
      </Link>
    </div>
  );
}
