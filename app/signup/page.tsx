import Link from "next/link";
import { Flame } from "lucide-react";
import { signup } from "./actions";

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Flame size={48} color="#FF1B6B" fill="#FF1B6B" style={{ margin: "0 auto" }} />
          <h1 className="display" style={{ fontSize: 36, marginTop: 14, lineHeight: 1 }}>
            CRIA SEU <span style={{ color: "#FF1B6B" }}>BUTICO</span>
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 10 }}>É de graça e sem moderação chata</p>
        </div>

        <form action={signup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input name="email" type="email" placeholder="email" required style={inputStyle} />
          <input name="password" type="password" placeholder="senha (min. 6)" required minLength={6} style={inputStyle} />
          {searchParams.error && (
            <div style={{ color: "#FF6A9E", fontSize: 13.5, textAlign: "center" }}>{searchParams.error}</div>
          )}
          <button type="submit" className="fire-bg display" style={btnStyle}>BORA</button>
        </form>

        <div style={{ textAlign: "center", marginTop: 22, color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "#FF1B6B", textDecoration: "none", fontWeight: 700 }}>
            entrar
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "14px 16px",
  color: "var(--text)",
  fontSize: 15,
  outline: "none"
};

const btnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: 14,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  color: "#fff",
  fontSize: 17,
  letterSpacing: 1
};
