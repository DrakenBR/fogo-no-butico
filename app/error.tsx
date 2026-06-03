"use client";

import Link from "next/link";
import { Flame } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, flexDirection: "column", textAlign: "center" }}>
      <Flame size={56} color="#FF1B6B" fill="#FF1B6B" />
      <h1 className="display" style={{ fontSize: 28, marginTop: 16 }}>DEU <span style={{ color: "#FF1B6B" }}>RUIM</span></h1>
      <p style={{ color: "#9A9AA0", marginTop: 6, maxWidth: 360 }}>{error.message || "Algo apagou o fogo. Tenta de novo."}</p>
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button onClick={reset} className="fire-bg display" style={{ padding: "12px 22px", borderRadius: 12, border: "none", color: "#fff", cursor: "pointer" }}>
          TENTAR DE NOVO
        </button>
        <Link href="/" style={{ padding: "12px 22px", borderRadius: 12, background: "#161519", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F5F7", textDecoration: "none" }}>
          Início
        </Link>
      </div>
    </div>
  );
}
