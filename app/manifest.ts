import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fogo no Butico",
    short_name: "FogoButico",
    description: "Bota fogo no butico. Rede de paquera com vibe.",
    start_url: "/",
    display: "standalone",
    background_color: "#0D0D0F",
    theme_color: "#FF1B6B",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
