import { Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import type { WeeklyRankingRow } from "@/types/database";

export function RankingPanel({
  rows,
  myPosition
}: {
  rows: WeeklyRankingRow[];
  myPosition?: number | null;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        // ocupa toda a altura do aside, sem estourar
        maxHeight: "100%",
        minHeight: 0,
        overflow: "hidden"
      }}
    >
      {/* HEADER (não rola) */}
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <Trophy size={20} color="#FFB13D" />
          <span className="display" style={{ fontSize: 18 }}>MAIS QUENTE</span>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>da semana 🔥</div>
      </div>

      {/* LISTA (rola dentro do card) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "8px 18px"
        }}
      >
        {rows.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
            Sem 🔥 essa semana ainda. Bota fogo!
          </div>
        )}

        {rows.map((r, i) => (
          <Link
            key={r.user_id}
            href={`/perfil/${r.username}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "9px 0",
              borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
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
                color: i === 0 ? "#FFD24D" : i === 1 ? "#C9C9D4" : i === 2 ? "#FF8A3D" : "var(--text-muted)",
                flexShrink: 0
              }}
            >
              {i + 1}
            </span>
            <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={38} ring={i < 3} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.display_name}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.city || `@${r.username}`}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#FF1B6B", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              <Flame size={15} fill="#FF1B6B" /> {r.fires}
            </div>
          </Link>
        ))}
      </div>

      {/* FOOTER (não rola) */}
      {myPosition != null && (
        <div
          style={{
            margin: 14,
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
