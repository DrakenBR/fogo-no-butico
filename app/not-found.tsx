import Link from "next/link";
import { Flame } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, flexDirection: "column", textAlign: "center" }}>
      <Flame size={56} color="#FF1B6B" fill="#FF1B6B" />
      <h1 className="display" style={{ fontSize: 32, marginTop: 16 }}>SUMIU NO <span style={{ color: "#FF1B6B" }}>FOGO</span></h1>
      <p style={{ color: "#9A9AA0", marginTop: 6 }}>Esse butico não existe ou já apagou.</p>
      <Link
        href="/"
        className="fire-bg display"
        style={{ marginTop: 22, padding: "12px 22px", borderRadius: 12, textDecoration: "none", color: "#fff" }}
      >
        VOLTAR
      </Link>
    </div>
  );
}
