import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Fogo no Butico — rede de paquera com vibe";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text)",
          padding: 80,
          fontFamily: "sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 180,
            borderRadius: 40,
            background: "linear-gradient(135deg, #FF1B6B 0%, #FF6A3D 60%, #FFB13D 100%)",
            marginBottom: 32
          }}
        >
          <svg width="120" height="120" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>
          FOGO NO <span style={{ color: "#FF1B6B", marginLeft: 22 }}>BUTICO</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 36, color: "var(--text-muted)" }}>
          Bota fogo no butico 🔥
        </div>
      </div>
    ),
    { ...size }
  );
}
