import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Flame, Grid3x3, MapPin, Settings } from "lucide-react";
import Link from "next/link";
import { lookingStyle, photoGradient } from "@/lib/utils";
import { logout } from "@/app/login/actions";
import { LinkButtons } from "@/components/LinkButtons";
import { ProfileActions } from "@/components/ProfileActions";
import { ProfileHighlights } from "@/components/ProfileHighlights";
import { BadgesRow } from "@/components/BadgesRow";
import { BadgeRefresher } from "@/components/BadgeRefresher";
import type { ProfileLink } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PerfilPage({ params }: { params: { username: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, media_url, media_type")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: postIds } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", profile.id);

  let totalFires = 0;
  if (postIds && postIds.length > 0) {
    const ids = postIds.map((p) => p.id);
    const { count } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .in("post_id", ids);
    totalFires = count ?? 0;
  }

  const { data: badgesData } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", profile.id);
  const badges = (badgesData ?? []).map((b: any) => b.badge_id as string);

  const isMe = user?.id === profile.id;
  const tag = lookingStyle[profile.looking_for as keyof typeof lookingStyle];

  return (
    <AppShell>
      <div>
        <div style={{ padding: 22, display: "flex", gap: 18, alignItems: "center" }}>
          <Avatar src={profile.avatar_url} seed={profile.username} initial={profile.display_name} size={90} ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="display" style={{ fontSize: 24, margin: 0 }}>{profile.display_name}</h1>
              {profile.verified && (
                <span style={{ background: "#FF1B6B", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>VERIFICADO</span>
              )}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>@{profile.username}</div>
            {profile.city && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                <MapPin size={13} /> {profile.city}{profile.age ? ` · ${profile.age} anos` : ""}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "0 22px 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ background: tag.bg, color: tag.color, fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 999 }}>
            {tag.label}
          </span>
          <BadgesRow badgeIds={badges} />
        </div>
        {isMe && <BadgeRefresher />}

        {profile.bio && (
          <p style={{ padding: "0 22px", fontSize: 15, lineHeight: 1.5, margin: "0 0 16px" }}>{profile.bio}</p>
        )}

        <div style={{ padding: "0 22px 18px", display: "flex", gap: 22 }}>
          <Stat label="posts" value={posts?.length ?? 0} />
          <Stat label="fogos" value={totalFires} icon={<Flame size={15} color="#FF1B6B" fill="#FF1B6B" />} />
        </div>

        {Array.isArray(profile.links) && profile.links.length > 0 && (
          <div style={{ padding: "0 22px 18px" }}>
            <LinkButtons links={profile.links as ProfileLink[]} />
          </div>
        )}

        {isMe && (
          <div style={{ padding: "0 22px 18px", display: "flex", gap: 8 }}>
            <Link
              href="/onboarding"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text)",
                textAlign: "center",
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Settings size={16} /> Editar
            </Link>
            <form action={logout} style={{ flex: 1 }}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Sair
              </button>
            </form>
          </div>
        )}

        {!isMe && user && (
          <div style={{ padding: "0 22px 18px", display: "flex", gap: 8 }}>
            <ProfileActions
              targetId={profile.id}
              targetUsername={profile.username}
              targetDisplayName={profile.display_name}
              targetAvatar={profile.avatar_url}
              meAvatar={null}
              meDisplayName={user.email ?? ""}
            />
          </div>
        )}

        <ProfileHighlights
          userId={profile.id}
          userUsername={profile.username}
          userDisplayName={profile.display_name}
          userAvatar={profile.avatar_url}
          meId={user?.id ?? null}
        />

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "14px 0 0", display: "flex", justifyContent: "center", gap: 6, color: "#FF1B6B", fontWeight: 700, fontSize: 13 }}>
          <Grid3x3 size={16} /> POSTS
        </div>

        {(!posts || posts.length === 0) ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>Sem posts ainda</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, marginTop: 14, padding: "0 3px" }}>
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/perfil/${profile.username}/posts/${p.id}`}
                aria-label="ver post"
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

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: 22, display: "flex", alignItems: "center", gap: 5 }}>
        {icon} {value}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</div>
    </div>
  );
}
