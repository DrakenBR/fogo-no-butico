"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Flag, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import type { AdminReportRow } from "@/types/database";

export function ReportsAdminTable() {
  const [rows, setRows] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("admin_reports");
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as AdminReportRow[]);
      setErr(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = (r: AdminReportRow) => {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("admin_resolve_report", { report_id: r.id });
      if (error) return alert(error.message);
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, resolved_at: new Date().toISOString() } : x)));
    });
  };

  const deleteTarget = (r: AdminReportRow) => {
    const ok = confirm(`Apagar ${r.kind === "user" ? "usuário" : r.kind === "post" ? "post" : "comentário"}?`);
    if (!ok) return;
    start(async () => {
      const supabase = createClient();
      let error;
      if (r.kind === "user") {
        const res = await supabase.rpc("admin_delete_user", { target: r.target_id });
        error = res.error;
      } else if (r.kind === "post") {
        const res = await supabase.from("posts").delete().eq("id", r.target_id);
        error = res.error;
      } else {
        const res = await supabase.from("comments").delete().eq("id", r.target_id);
        error = res.error;
      }
      if (error) return alert(error.message);
      // resolve o report também
      await supabase.rpc("admin_resolve_report", { report_id: r.id });
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, resolved_at: new Date().toISOString() } : x)));
    });
  };

  const pending = rows.filter((r) => !r.resolved_at);
  const resolved = rows.filter((r) => r.resolved_at);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Flag size={20} color="#FF1B6B" />
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>
          REPORTS ({pending.length} pendente{pending.length === 1 ? "" : "s"})
        </h2>
      </div>

      {loading && <div style={{ color: "#9A9AA0", padding: 20 }}>Carregando...</div>}
      {err && <div style={{ color: "#FF6A9E", padding: 12 }}>{err}</div>}

      {!loading && !err && pending.length === 0 && resolved.length === 0 && (
        <div style={{ color: "#9A9AA0", padding: 20 }}>Nenhuma denúncia ainda 🔥</div>
      )}

      {!loading && !err && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.map((r) => (
            <ReportCard key={r.id} r={r} onResolve={() => resolve(r)} onDelete={() => deleteTarget(r)} />
          ))}

          {resolved.length > 0 && (
            <>
              <div style={{ color: "#9A9AA0", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, padding: "16px 0 4px", textTransform: "uppercase" }}>
                Resolvidos ({resolved.length})
              </div>
              {resolved.slice(0, 20).map((r) => (
                <ReportCard key={r.id} r={r} muted />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  r,
  onResolve,
  onDelete,
  muted = false
}: {
  r: AdminReportRow;
  onResolve?: () => void;
  onDelete?: () => void;
  muted?: boolean;
}) {
  const targetLink =
    r.kind === "user" && r.context_username
      ? `/perfil/${r.context_username}`
      : (r.kind === "post" || r.kind === "comment") && r.context_username
      ? `/perfil/${r.context_username}/posts/${r.target_id}`
      : "#";

  return (
    <div
      style={{
        background: muted ? "transparent" : "#161519",
        border: muted ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,27,107,0.18)",
        borderRadius: 12,
        padding: 14,
        opacity: muted ? 0.6 : 1
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar src={r.reporter_avatar_url} seed={r.reporter_username} initial={r.reporter_display_name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: "#F5F5F7" }}>
            <span style={{ fontWeight: 700 }}>@{r.reporter_username}</span>
            <span style={{ color: "#9A9AA0" }}> denunciou </span>
            <span style={{ fontWeight: 600 }}>
              {r.kind === "user" ? "usuário" : r.kind === "post" ? "post" : "comentário"}{" "}
              {r.context_username ? `de @${r.context_username}` : ""}
            </span>
          </div>
          {r.reason && (
            <div style={{ color: "#FF6A9E", fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>
              {r.reason}
            </div>
          )}
          {r.snippet && (
            <div
              style={{
                color: "#9A9AA0",
                fontSize: 12.5,
                marginTop: 6,
                padding: "6px 10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical"
              }}
            >
              &quot;{r.snippet}&quot;
            </div>
          )}
          <div style={{ color: "#9A9AA0", fontSize: 11.5, marginTop: 6 }}>{timeAgo(r.created_at)}{r.resolved_at ? ` · resolvido ${timeAgo(r.resolved_at)}` : ""}</div>
        </div>

        {!muted && (
          <div style={{ display: "flex", gap: 6 }}>
            <Link
              href={targetLink}
              target="_blank"
              aria-label="abrir"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "6px 8px",
                color: "#9A9AA0",
                textDecoration: "none",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ExternalLink size={14} />
            </Link>
            <button
              onClick={onDelete}
              title="apagar alvo"
              style={{
                background: "rgba(255,27,107,0.12)",
                border: "1px solid rgba(255,27,107,0.3)",
                borderRadius: 8,
                padding: "6px 8px",
                color: "#FF1B6B",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onResolve}
              title="marcar resolvido"
              style={{
                background: "rgba(255,177,61,0.12)",
                border: "1px solid rgba(255,177,61,0.3)",
                borderRadius: 8,
                padding: "6px 8px",
                color: "#FFB13D",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <Check size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
