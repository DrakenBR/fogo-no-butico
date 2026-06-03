import { badgeFor } from "@/lib/badges";

export function BadgesRow({ badgeIds }: { badgeIds: string[] }) {
  const badges = badgeIds.map(badgeFor).filter(Boolean);
  if (badges.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {badges.map((b) => (
        <div
          key={b!.id}
          title={b!.description}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 9px",
            borderRadius: 999,
            background: `${b!.color}1c`,
            border: `1px solid ${b!.color}55`,
            color: b!.color,
            fontSize: 11.5,
            fontWeight: 700
          }}
        >
          <span>{b!.emoji}</span> {b!.label}
        </div>
      ))}
    </div>
  );
}
