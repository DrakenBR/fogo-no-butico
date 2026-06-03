import { Store, Youtube, Instagram, Twitch } from "lucide-react";
import type { LinkType } from "@/types/database";

interface Props {
  type: LinkType;
  size?: number;
  color?: string;
}

export function LinkIcon({ type, size = 18, color = "currentColor" }: Props) {
  if (type === "loja") return <Store size={size} color={color} />;
  if (type === "youtube") return <Youtube size={size} color={color} />;
  if (type === "instagram") return <Instagram size={size} color={color} />;
  if (type === "twitch") return <Twitch size={size} color={color} />;
  if (type === "tiktok") {
    // Lucide não tem TikTok — SVG simplificado da nota musical característica
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-label="TikTok">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.4a8.16 8.16 0 0 0 4.77 1.52V6.55a4.77 4.77 0 0 1-1.84-.06Z" />
      </svg>
    );
  }
  if (type === "discord") {
    // Lucide não tem Discord — SVG simplificado do logo
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-label="Discord">
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.035c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.073-.035 19.74 19.74 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.045-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
      </svg>
    );
  }
  return null;
}
