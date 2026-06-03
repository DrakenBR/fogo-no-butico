export type BadgeId =
  | "first_fire_week"
  | "ten_matches"
  | "fire_for_real"
  | "hottest_comment";

interface BadgeDef {
  id: BadgeId;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const BADGES: Record<BadgeId, BadgeDef> = {
  first_fire_week: {
    id: "first_fire_week",
    label: "Primeiro Fogo",
    emoji: "🔥",
    description: "Botou fogo em algum post essa semana",
    color: "#FF1B6B"
  },
  ten_matches: {
    id: "ten_matches",
    label: "10 Matches",
    emoji: "💥",
    description: "Já deu match com 10 buticos",
    color: "#FFB13D"
  },
  fire_for_real: {
    id: "fire_for_real",
    label: "Pegou Fogo de Verdade",
    emoji: "⚡",
    description: "5 matches num único dia",
    color: "#FF6A3D"
  },
  hottest_comment: {
    id: "hottest_comment",
    label: "Comentário Quente",
    emoji: "🌶️",
    description: "Comentário com 50+ fogos",
    color: "#C49BFF"
  }
};

export function badgeFor(id: string): BadgeDef | null {
  return BADGES[id as BadgeId] ?? null;
}
