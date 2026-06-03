import Link from "next/link";
import { Flame } from "lucide-react";
import { login } from "./actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Flame size={48} color="#FF1B6B" fill="#FF1B6B" style={{ margin: "0 auto" }} />
          <h1 className="display" style={{ fontSize: 38, marginTop: 14, lineHeight: 1 }}>
            FOGO NO <span style={{ color: "#FF1B6B" }}>BUTICO</span>
          </h1>
          <p style={{ color: "#9A9AA0", marginTop: 10 }}>Entra e bota fogo 🔥</p>
        </div>

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="next" value={searchParams.next ?? "/"} />
          <input
            name="email"
            type="email"
            placeholder="email"
            required
            autoComplete="email"
            style={inputStyle}
          />
          <input
            name="password"
            type="password"
            placeholder="senha"
            required
            autoComplete="current-password"
            style={inputStyle}
          />
          {searchParams.error && (
            <div style={{ color: "#FF6A9E", fontSize: 13.5, textAlign: "center" }}>{searchParams.error}</div>
          )}
          <button type="submit" className="fire-bg display" style={btnStyle}>ENTRAR</button>
        </form>

        <div style={{ textAlign: "center", marginTop: 22, color: "#9A9AA0" }}>
          Sem conta?{" "}
          <Link href="/signup" style={{ color: "#FF1B6B", textDecoration: "none", fontWeight: 700 }}>
            cria uma
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#161519",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "14px 16px",
  color: "#F5F5F7",
  fontSize: 15,
  outline: "none"
};

const btnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "14px",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  color: "#fff",
  fontSize: 17,
  letterSpacing: 1
};
