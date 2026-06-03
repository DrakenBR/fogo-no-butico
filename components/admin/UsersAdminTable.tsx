"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, Shield, ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import type { AdminUserRow } from "@/types/database";

export function UsersAdminTable({ meId }: { meId: string }) {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [, start] = useTransition();

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("admin_users");
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as AdminUserRow[]);
      setErr(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteUser = (row: AdminUserRow) => {
    if (row.id === meId) return alert("Você não pode deletar a si mesmo");
    const confirmed = confirm(
      `Apagar @${row.username} (${row.email})?\n\nIsso vai cascatear: posts, fogos, comentários, stories. Não tem volta.`
    );
    if (!confirmed) return;
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("admin_delete_user", { target: row.id });
      if (error) {
        alert(`Falhou: ${error.message}`);
        return;
      }
      setRows((r) => r.filter((u) => u.id !== row.id));
    });
  };

  const toggleAdmin = (row: AdminUserRow) => {
    if (row.id === meId && row.is_admin) {
      return alert("Você não pode tirar seu próprio admin");
    }
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !row.is_admin })
        .eq("id", row.id);
      if (error) {
        alert(error.message);
        return;
      }
      setRows((rs) => rs.map((u) => (u.id === row.id ? { ...u, is_admin: !u.is_admin } : u)));
    });
  };

  const filtered = q.trim()
    ? rows.filter((r) => {
        const s = q.toLowerCase();
        return (
          r.username.toLowerCase().includes(s) ||
          r.display_name.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          (r.city ?? "").toLowerCase().includes(s)
        );
      })
    : rows;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>
          USUÁRIOS ({rows.length})
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filtrar..."
          style={{
            background: "#161519",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "8px 12px",
            color: "#F5F5F7",
            outline: "none",
            fontSize: 13,
            width: 240
          }}
        />
      </div>

      {loading && <div style={{ color: "#9A9AA0", padding: 20 }}>Carregando...</div>}
      {err && <div style={{ color: "#FF6A9E", padding: 12 }}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#1E1C22", color: "#9A9AA0", textAlign: "left" }}>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Cidade</Th>
                <Th>Posts</Th>
                <Th>🔥</Th>
                <Th>Cadastro</Th>
                <Th>Último login</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <Td>
                    <Link
                      href={`/perfil/${r.username}`}
                      target="_blank"
                      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                    >
                      <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={32} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                          {r.display_name}
                          {r.is_admin && <ShieldCheck size={14} color="#FFB13D" />}
                        </div>
                        <div style={{ color: "#9A9AA0", fontSize: 12 }}>@{r.username}</div>
                      </div>
                    </Link>
                  </Td>
                  <Td>
                    <span style={{ color: "#9A9AA0" }}>{r.email}</span>
                  </Td>
                  <Td>{r.city || "—"}</Td>
                  <Td style={{ fontWeight: 700 }}>{r.posts_count}</Td>
                  <Td style={{ color: "#FF1B6B", fontWeight: 700 }}>{r.fires_count}</Td>
                  <Td style={{ color: "#9A9AA0" }}>{timeAgo(r.created_at)}</Td>
                  <Td style={{ color: "#9A9AA0" }}>{r.last_sign_in_at ? timeAgo(r.last_sign_in_at) : "—"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => toggleAdmin(r)}
                        disabled={r.id === meId && r.is_admin}
                        title={r.is_admin ? "Tirar admin" : "Promover a admin"}
                        style={{
                          background: r.is_admin ? "rgba(255,177,61,0.15)" : "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          padding: "5px 8px",
                          color: r.is_admin ? "#FFB13D" : "#9A9AA0",
                          cursor: r.id === meId && r.is_admin ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <Shield size={14} />
                      </button>
                      <Link
                        href={`/perfil/${r.username}`}
                        target="_blank"
                        title="ver perfil"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          padding: "5px 8px",
                          color: "#9A9AA0",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={() => deleteUser(r)}
                        disabled={r.id === meId}
                        title={r.id === meId ? "Não pode deletar a si mesmo" : "Deletar"}
                        style={{
                          background: r.id === meId ? "transparent" : "rgba(255,27,107,0.12)",
                          border: "1px solid rgba(255,27,107,0.25)",
                          borderRadius: 8,
                          padding: "5px 8px",
                          color: "#FF1B6B",
                          cursor: r.id === meId ? "not-allowed" : "pointer",
                          opacity: r.id === meId ? 0.4 : 1,
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9A9AA0" }}>
                    Nenhum user pra esse filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "10px 12px", fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "10px 12px", verticalAlign: "middle", ...style }}>{children}</td>;
}
