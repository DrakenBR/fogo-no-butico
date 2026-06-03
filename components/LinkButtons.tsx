import { LinkIcon } from "./LinkIcon";
import { LINK_TYPES, type ProfileLink } from "@/types/database";

const META = Object.fromEntries(LINK_TYPES.map((t) => [t.id, t]));

export function LinkButtons({ links }: { links: ProfileLink[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {links.slice(0, 4).map((l, i) => {
        const meta = META[l.type];
        if (!meta) return null;
        return (
          <a
            key={i}
            href={normalizeUrl(l.url)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={meta.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${meta.color}55`,
              color: meta.color,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              transition: "transform .12s ease, background .12s ease"
            }}
          >
            <LinkIcon type={l.type} size={16} color={meta.color} />
            {meta.label}
          </a>
        );
      })}
    </div>
  );
}

function normalizeUrl(u: string): string {
  const s = u.trim();
  if (!s) return "#";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}
