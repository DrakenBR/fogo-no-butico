import type { LookingFor } from "@/types/database";

export const lookingStyle: Record<LookingFor, { bg: string; color: string; label: string }> = {
  amante: { bg: "rgba(255,27,107,0.15)", color: "#FF6A9E", label: "💋 amante" },
  marido: { bg: "rgba(122,31,255,0.18)", color: "#C49BFF", label: "💍 marido" },
  zoeira: { bg: "rgba(255,138,61,0.16)", color: "#FFB13D", label: "🍻 zoeira" }
};

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function avatarGradient(seed: string | null | undefined): string {
  const gradients = [
    "linear-gradient(135deg,#FF1B6B,#7A1FFF)",
    "linear-gradient(135deg,#FF6A3D,#FF1B6B)",
    "linear-gradient(135deg,#FF2E88,#FF8A3D)",
    "linear-gradient(135deg,#B91FFF,#FF1B6B)",
    "linear-gradient(135deg,#FF4D6D,#FFB13D)",
    "linear-gradient(135deg,#FF1B6B,#1FB6FF)"
  ];
  if (!seed) return gradients[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export function photoGradient(seed: string | null | undefined): string {
  const gradients = [
    "linear-gradient(160deg,#2a1020,#FF1B6B33,#0D0D0F)",
    "linear-gradient(160deg,#2a1810,#FF6A3D33,#0D0D0F)",
    "linear-gradient(160deg,#1a1030,#B91FFF33,#0D0D0F)",
    "linear-gradient(160deg,#301018,#FF2E8833,#0D0D0F)"
  ];
  if (!seed) return gradients[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

// ============================================================
// Filtros de imagem (Instagram-like)
// ============================================================
export type FilterPreset =
  | "original"
  | "clarendon"
  | "gingham"
  | "juno"
  | "lark"
  | "moon"
  | "valencia"
  | "willow";

export const FILTER_PRESETS: Record<FilterPreset, string> = {
  original: "none",
  clarendon: "contrast(1.2) saturate(1.35) brightness(1.05)",
  gingham: "brightness(1.05) hue-rotate(-10deg) saturate(0.85)",
  juno: "contrast(1.15) saturate(1.4) hue-rotate(-8deg)",
  lark: "contrast(0.9) brightness(1.1) saturate(1.1)",
  moon: "grayscale(1) brightness(1.1) contrast(1.1)",
  valencia: "sepia(0.15) brightness(1.05) saturate(1.2)",
  willow: "grayscale(0.5) brightness(1.05) contrast(0.95)"
};

/** Aplica o filtro CSS num canvas e devolve o blob comprimido */
export async function applyFilter(file: File, preset: FilterPreset): Promise<Blob> {
  if (preset === "original") return file;
  const bitmap = await createImageBitmap(file);
  const maxDim = 1600;
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.filter = FILTER_PRESETS[preset];
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85)
  );
}

export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality)
  );
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}
