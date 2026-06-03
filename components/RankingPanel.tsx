import { Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import type { WeeklyRankingRow } from "@/types/database";

export function RankingPanel({
  rows,
  myPosition,
  compact = false
}: {
  rows: WeeklyRankingRow[];
  myPosition?: number | null;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "#161519",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        padding: 18
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Trophy size={20} color="#FFB13D" />
        <span className="display" style={{ fontSize: 18 }}>MAIS QUENTE</span>
      </div>
      <div style={{ color: "#9A9AA0", fontSize: 12.5, marginBottom: 16 }}>da semana 🔥</div>

      {rows.length === 0 && (
        <div style={{ color: "#9A9AA0", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          Sem 🔥 essa semana ainda. Bota fogo!
        </div>
      )}

      {rows.slice(0, compact ? 5 : 20).map((r, i) => (
        <Link
          key={r.user_id}
          href={`/perfil/${r.username}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "9px 0",
            borderBottom: i < Math.min(rows.length, compact ? 5 : 20) - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            textDecoration: "none",
            color: "inherit"
          }}
        >
          <span
            className="display"
            style={{
              fontSize: 18,
              width: 24,
              textAlign: "center",
              color: i === 0 ? "#FFD24D" : i === 1 ? "#C9C9D4" : i === 2 ? "#FF8A3D" : "#9A9AA0"
            }}
          >
            {i + 1}
          </span>
          <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={38} ring={i < 3} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.display_name}
            </div>
            <div style={{ color: "#9A9AA0", fontSize: 12 }}>{r.city || `@${r.username}`}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#FF1B6B", fontWeight: 700, fontSize: 14 }}>
            <Flame size={15} fill="#FF1B6B" /> {r.fires}
          </div>
        </Link>
      ))}

      {myPosition != null && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,27,107,0.10)",
            border: "1px solid rgba(255,27,107,0.25)",
            fontSize: 13
          }}
        >
          Você tá em <span style={{ color: "#FF1B6B", fontWeight: 700 }}>#{myPosition}</span> — bota mais fogo! 🔥
        </div>
      )}
    </div>
  );
}
