import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
}

export function KpiCard({ label, value, sub, icon: Icon, accent = "#FF1B6B" }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {label}
        </span>
        <Icon size={18} color={accent} />
      </div>
      <div className="display" style={{ fontSize: 32, lineHeight: 1, color: "var(--text)" }}>
        {value}
      </div>
      {sub && <div style={{ color: accent, fontSize: 12, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
