import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fogo no Butico",
  description: "Bota fogo no butico. Rede de paquera com vibe.",
  manifest: undefined
};

export const viewport: Viewport = {
  themeColor: "#0D0D0F",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bg text-text min-h-screen">{children}</body>
    </html>
  );
}
