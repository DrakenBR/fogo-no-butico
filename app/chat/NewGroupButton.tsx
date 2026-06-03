"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Users, Check, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";

interface PickedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function NewGroupButton({ meId }: { meId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<PickedUser[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PickedUser[]>([]);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // search users
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    let canceled = false;
    const h = setTimeout(async () => {
      let q = supabase.from("profiles").select("id, username, display_name, avatar_url").limit(8);
      if (search.trim()) {
        const term = search.replace(/[%_]/g, "");
        q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
      } else {
        q = q.order("created_at", { ascending: false });
      }
      const { data } = await q;
      if (canceled) return;
      const pickedIds = new Set(picked.map((p) => p.id));
      setResults(((data ?? []) as PickedUser[]).filter((r) => r.id !== meId && !pickedIds.has(r.id)));
    }, 200);
    return () => {
      canceled = true;
      clearTimeout(h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, picked, open]);

  const close = () => {
    setOpen(false);
    setName("");
    setPicked([]);
    setSearch("");
    setResults([]);
    setErr(null);
  };

  const submit = () => {
    if (!name.trim()) return setErr("Põe um nome no grupo");
    if (picked.length < 1) return setErr("Adiciona pelo menos 1 butico");

    start(async () => {
      const supabase = createClient();
      const { data: groupData, error: gErr } = await supabase
        .from("groups")
        .insert({ name: name.trim().slice(0, 60), created_by: meId })
        .select("id")
        .single();
      if (gErr || !groupData) {
        setErr(gErr?.message ?? "falha");
        return;
      }
      // Trigger já me adicionou como admin. Agora adiciono os outros.
      const rows = picked.map((p) => ({ group_id: groupData.id, user_id: p.id, is_admin: false }));
      const { error: mErr } = await supabase.from("group_members").insert(rows);
      if (mErr) {
        setErr(mErr.message);
        return;
      }
      close();
      router.push(`/chat/g/${groupData.id}`);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fire-bg"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 999,
          border: "none",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer"
        }}
      >
        <UserPlus size={14} /> Novo grupo
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              maxHeight: "85vh",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} color="#C49BFF" />
                <span className="display" style={{ fontSize: 18 }}>NOVO GRUPO</span>
              </div>
              <button onClick={close} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do grupo (ex: 'Pegação SP')"
              maxLength={60}
              style={inputStyle}
            />

            {picked.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {picked.map((p) => (
                  <span
                    key={p.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: "rgba(196,155,255,0.15)",
                      border: "1px solid #C49BFF",
                      color: "#C49BFF",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    @{p.username}
                    <button
                      onClick={() => setPicked(picked.filter((x) => x.id !== p.id))}
                      style={{ background: "none", border: "none", color: "#C49BFF", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar butico pra adicionar..."
              style={inputStyle}
            />

            <div style={{ maxHeight: 240, overflowY: "auto", margin: "-4px -4px 0", padding: "0 4px" }}>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setPicked([...picked, r]);
                    setSearch("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 8px",
                    borderRadius: 10,
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    width: "100%",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.display_name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>@{r.username}</div>
                  </div>
                  <Plus size={14} color="#C49BFF" />
                </button>
              ))}
              {results.length === 0 && search && (
                <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 12 }}>nenhum match</div>
              )}
            </div>

            {err && <div style={{ color: "#FF6A9E", fontSize: 13 }}>{err}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={close} disabled={pending} style={btnGhost}>Cancelar</button>
              <button onClick={submit} disabled={pending} className="fire-bg" style={btnPrimary}>
                <Check size={14} /> {pending ? "Criando..." : `Criar (${picked.length + 1})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-up)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  width: "100%"
};

const btnGhost: React.CSSProperties = {
  flex: 1,
  padding: "11px 12px",
  borderRadius: 10,
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14
};
const btnPrimary: React.CSSProperties = {
  flex: 1,
  padding: "11px 12px",
  borderRadius: 10,
  border: "none",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6
};
