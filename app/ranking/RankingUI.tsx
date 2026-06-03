"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, MapPin, Globe } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";

interface RankRow {
  user_id: string;
  username: string;
  display_name: string;
  city: string | null;
  avatar_url: string | null;
  fires: number;
  rank_position: number;
}

export function RankingUI({ meId, cities }: { meId: string | null; cities: { city: string; total: number }[] }) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("weekly_ranking_by_city", { city_filter: selectedCity });
      setRows((data ?? []) as RankRow[]);
      setLoading(false);
    })();
  }, [selectedCity]);

  const myPosition = meId ? rows.find((r) => r.user_id === meId)?.rank_position ?? null : null;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div style={{ padding: 22 }}>
      <h1 className="display" style={{ fontSize: 28, marginBottom: 4 }}>
        MAIS <span className="fire-text">QUENTE</span>{" "}
        {selectedCity ? <span style={{ color: "#FF1B6B" }}>DE {selectedCity.toUpperCase()}</span> : "DA SEMANA"}
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Quem tá pegando fogo nos últimos 7 dias 🔥</p>

      <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 22, paddingBottom: 4 }}>
        <button
          onClick={() => setSelectedCity(null)}
          style={chipStyle(selectedCity === null)}
        >
          <Globe size={12} /> Global
        </button>
        {cities.map((c) => (
          <button
            key={c.city}
            onClick={() => setSelectedCity(c.city)}
            style={chipStyle(selectedCity === c.city)}
          >
            <MapPin size={11} /> {c.city} <span style={{ opacity: 0.6, marginLeft: 2 }}>{c.total}</span>
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>Carregando...</div>}

      {!loading && podium.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "end", marginBottom: 26 }}>
          <PodiumStep position={2} row={podium[1]} />
          <PodiumStep position={1} row={podium[0]} />
          <PodiumStep position={3} row={podium[2]} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {!loading && rest.length === 0 && rows.length > 0 && (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Só tem o pódio essa semana 🔥</div>
        )}
        {!loading && rows.length === 0 && (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
            Sem 🔥 {selectedCity ? `em ${selectedCity}` : "ainda"}. Bota fogo!
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
              borderBottom: i < rest.length - 1 ? "1px solid var(--border)" : "none",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <span className="display" style={{ width: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 18 }}>
              {i + 4}
            </span>
            <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.display_name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{r.city || `@${r.username}`}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#FF1B6B", fontWeight: 700 }}>
              <Flame size={17} fill="#FF1B6B" /> {r.fires}
            </div>
          </Link>
        ))}
      </div>

      {myPosition != null && Number(myPosition) > 3 && (
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
          Você tá em <span style={{ color: "#FF1B6B", fontWeight: 700 }}>#{myPosition}</span>{" "}
          {selectedCity ? `de ${selectedCity}` : "globalmente"} — bota mais fogo!
        </div>
      )}
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "7px 12px",
    borderRadius: 999,
    border: active ? "1px solid #FF1B6B" : "1px solid var(--border)",
    background: active ? "rgba(255,27,107,0.15)" : "var(--surface)",
    color: active ? "#FF1B6B" : "var(--text-muted)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap"
  };
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
          color: "var(--bg)",
          fontSize: 32
        }}
      >
        {position}
      </div>
    </Link>
  );
}
