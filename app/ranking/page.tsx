import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { Flame } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("weekly_ranking")
    .select("*")
    .order("fires", { ascending: false })
    .limit(100);

  const rows = data ?? [];
  const myPosition = user ? rows.find((r) => r.user_id === user.id)?.position ?? null : null;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <h1 className="display" style={{ fontSize: 28, marginBottom: 4 }}>
          MAIS <span className="fire-text">QUENTE</span> DA SEMANA
        </h1>
        <p style={{ color: "#9A9AA0", marginBottom: 22 }}>Quem tá pegando fogo nos últimos 7 dias 🔥</p>

        {podium.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "end", marginBottom: 26 }}>
            <PodiumStep position={2} row={podium[1]} />
            <PodiumStep position={1} row={podium[0]} />
            <PodiumStep position={3} row={podium[2]} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {rest.length === 0 && rows.length > 0 && (
            <div style={{ color: "#9A9AA0", textAlign: "center", padding: 20 }}>Só tem o pódio essa semana 🔥</div>
          )}
          {rows.length === 0 && (
            <div style={{ color: "#9A9AA0", textAlign: "center", padding: 40 }}>
              Sem 🔥 ainda. Bota fogo no primeiro post.
            </div>
          )}
          {rest.map((r, i) => (
            <Link
              key={r.user_id}
              href={`/perfil/${r.username}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 4px",
                borderBottom: i < rest.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <span className="display" style={{ width: 30, textAlign: "center", color: "#9A9AA0", fontSize: 18 }}>
                {i + 4}
              </span>
              <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.display_name}</div>
                <div style={{ color: "#9A9AA0", fontSize: 13 }}>{r.city || `@${r.username}`}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#FF1B6B", fontWeight: 700 }}>
                <Flame size={17} fill="#FF1B6B" /> {r.fires}
              </div>
            </Link>
          ))}
        </div>

        {myPosition != null && myPosition > 3 && (
          <div
            style={{
              position: "sticky",
              bottom: 92,
              marginTop: 22,
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,27,107,0.12)",
              border: "1px solid rgba(255,27,107,0.3)",
              textAlign: "center"
            }}
          >
            Você tá em <span style={{ color: "#FF1B6B", fontWeight: 700 }}>#{myPosition}</span> — bota mais fogo!
          </div>
        )}
      </div>
    </AppShell>
  );
}

function PodiumStep({
  position,
  row
}: {
  position: 1 | 2 | 3;
  row?: { username: string; display_name: string; avatar_url: string | null; fires: number };
}) {
  if (!row) return <div />;
  const color = position === 1 ? "#FFD24D" : position === 2 ? "#C9C9D4" : "#FF8A3D";
  const height = position === 1 ? 110 : position === 2 ? 84 : 70;
  return (
    <Link href={`/perfil/${row.username}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <Avatar src={row.avatar_url} seed={row.username} initial={row.display_name} size={position === 1 ? 76 : 62} ring />
      <div style={{ fontWeight: 700, fontSize: 14, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", whiteSpace: "nowrap" }}>
        {row.display_name.split(" ")[0]}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#FF1B6B", fontSize: 13, fontWeight: 700 }}>
        <Flame size={14} fill="#FF1B6B" /> {row.fires}
      </div>
      <div
        className="display"
        style={{
          width: "100%",
          height,
          borderRadius: "10px 10px 0 0",
          background: `linear-gradient(180deg, ${color} 0%, rgba(255,27,107,0.2) 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0D0D0F",
          fontSize: 32
        }}
      >
        {position}
      </div>
    </Link>
  );
}
