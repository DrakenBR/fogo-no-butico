"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X, Users, Pencil, UserPlus, Trash2, LogOut, ShieldCheck, Plus, Check, ArrowLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";

interface Member {
  user_id: string;
  is_admin: boolean;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface CandidateUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Props {
  groupId: string;
  groupName: string;
  meId: string;
  members: Member[];
  onClose: () => void;
}

export function GroupSettingsDialog({ groupId, groupName, meId, members: initialMembers, onClose }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [name, setName] = useState(groupName);
  const [editName, setEditName] = useState(false);
  const [tab, setTab] = useState<"main" | "add">("main");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CandidateUser[]>([]);
  const [picked, setPicked] = useState<CandidateUser[]>([]);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const meIsAdmin = members.find((m) => m.user_id === meId)?.is_admin ?? false;

  // procura buticos pra adicionar, excluindo atuais membros e meus blocks
  useEffect(() => {
    if (tab !== "add") return;
    const supabase = createClient();
    let canceled = false;
    const h = setTimeout(async () => {
      let q = supabase.from("profiles").select("id, username, display_name, avatar_url").limit(20);
      if (search.trim()) {
        const term = search.replace(/[%_]/g, "");
        q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
      } else {
        q = q.order("created_at", { ascending: false });
      }
      const { data } = await q;
      if (canceled) return;
      const memberIds = new Set(members.map((m) => m.user_id));
      const pickedIds = new Set(picked.map((p) => p.id));
      setResults(((data ?? []) as CandidateUser[]).filter((r) => !memberIds.has(r.id) && !pickedIds.has(r.id)));
    }, 200);
    return () => {
      canceled = true;
      clearTimeout(h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, picked, members, tab]);

  const saveName = () => {
    if (!name.trim() || name.trim() === groupName) {
      setEditName(false);
      return;
    }
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("groups").update({ name: name.trim().slice(0, 60) }).eq("id", groupId);
      if (error) {
        setErr(error.message);
        return;
      }
      setEditName(false);
      router.refresh();
    });
  };

  const removeMember = (m: Member) => {
    if (!confirm(`Remover @${m.profile?.username} do grupo?`)) return;
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", m.user_id);
      if (error) return setErr(error.message);
      setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
    });
  };

  const toggleAdmin = (m: Member) => {
    if (!meIsAdmin || m.user_id === meId) return;
    start(async () => {
      const supabase = createClient();
      const next = !m.is_admin;
      const { error } = await supabase
        .from("group_members")
        .update({ is_admin: next })
        .eq("group_id", groupId)
        .eq("user_id", m.user_id);
      if (error) return setErr(error.message);
      setMembers((prev) => prev.map((x) => (x.user_id === m.user_id ? { ...x, is_admin: next } : x)));
    });
  };

  const addPicked = () => {
    if (picked.length === 0) return;
    start(async () => {
      const supabase = createClient();
      const rows = picked.map((p) => ({ group_id: groupId, user_id: p.id, is_admin: false }));
      const { error } = await supabase.from("group_members").insert(rows);
      if (error) return setErr(error.message);
      // refresh members list
      const { data: refreshed } = await supabase
        .from("group_members")
        .select("user_id, is_admin, profile:profiles!group_members_user_id_fkey(username, display_name, avatar_url)")
        .eq("group_id", groupId);
      if (refreshed) setMembers(refreshed as unknown as Member[]);
      setPicked([]);
      setSearch("");
      setTab("main");
      router.refresh();
    });
  };

  const leaveGroup = () => {
    if (!confirm("Sair do grupo? Você não vai mais ver as mensagens.")) return;
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", meId);
      if (error) return setErr(error.message);
      router.push("/chat");
      router.refresh();
    });
  };

  const deleteGroup = () => {
    if (!confirm(`Apagar o grupo "${groupName}"? Não tem volta.`)) return;
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) return setErr(error.message);
      router.push("/chat");
      router.refresh();
    });
  };

  // ordena: admins primeiro, depois alfabético
  const sortedMembers = [...members].sort((a, b) => {
    if (a.is_admin !== b.is_admin) return a.is_admin ? -1 : 1;
    return (a.profile?.display_name ?? "").localeCompare(b.profile?.display_name ?? "");
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "88vh",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {tab === "add" && (
              <button onClick={() => { setTab("main"); setPicked([]); setSearch(""); }} style={iconBtn}>
                <ArrowLeft size={18} />
              </button>
            )}
            <Users size={18} color="#C49BFF" />
            <span className="display" style={{ fontSize: 18 }}>
              {tab === "add" ? "ADICIONAR" : "INFO DO GRUPO"}
            </span>
          </div>
          <button onClick={onClose} style={iconBtn}>
            <X size={20} />
          </button>
        </div>

        {tab === "main" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {/* Nome */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 0 16px" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7A1FFF 0%, #FF1B6B 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff"
                }}
              >
                <Users size={32} />
              </div>
              {editName && meIsAdmin ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", maxWidth: 280 }}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    autoFocus
                    style={{
                      flex: 1,
                      background: "var(--surface-up)",
                      border: "1px solid #C49BFF",
                      borderRadius: 10,
                      padding: "8px 12px",
                      color: "var(--text)",
                      fontSize: 16,
                      fontWeight: 700,
                      outline: "none",
                      textAlign: "center"
                    }}
                  />
                  <button onClick={saveName} disabled={pending} style={{ ...iconBtn, color: "#C49BFF" }}>
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="display" style={{ fontSize: 22 }}>{groupName}</span>
                  {meIsAdmin && (
                    <button onClick={() => setEditName(true)} style={iconBtn} title="Editar nome">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{members.length} membros</span>
            </div>

            {/* Adicionar */}
            {meIsAdmin && (
              <button
                onClick={() => setTab("add")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  borderRadius: 12,
                  background: "rgba(196,155,255,0.08)",
                  border: "1px dashed rgba(196,155,255,0.45)",
                  color: "#C49BFF",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                  width: "100%",
                  marginBottom: 12
                }}
              >
                <UserPlus size={16} /> Adicionar membros
              </button>
            )}

            {/* Lista de membros */}
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, margin: "10px 0 6px" }}>
              MEMBROS
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sortedMembers.map((m) => (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-soft)"
                  }}
                >
                  <Link href={`/perfil/${m.profile?.username ?? ""}`} aria-label="ver perfil">
                    <Avatar src={m.profile?.avatar_url} seed={m.profile?.username} initial={m.profile?.display_name} size={36} />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      {m.profile?.display_name ?? "anônimo"}
                      {m.user_id === meId && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>(você)</span>}
                      {m.is_admin && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#FFB13D", fontSize: 10.5, fontWeight: 700, border: "1px solid #FFB13D55", padding: "1px 6px", borderRadius: 999 }}>
                          <ShieldCheck size={10} /> ADMIN
                        </span>
                      )}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>@{m.profile?.username}</div>
                  </div>
                  {meIsAdmin && m.user_id !== meId && (
                    <>
                      <button
                        onClick={() => toggleAdmin(m)}
                        title={m.is_admin ? "Tirar admin" : "Promover a admin"}
                        style={{ ...iconBtn, color: m.is_admin ? "#FFB13D" : "var(--text-muted)" }}
                      >
                        <ShieldCheck size={14} />
                      </button>
                      <button onClick={() => removeMember(m)} title="Remover" style={{ ...iconBtn, color: "#FF6A9E" }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {err && <div style={{ color: "#FF6A9E", fontSize: 13, marginTop: 10 }}>{err}</div>}

            {/* Ações */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <button
                onClick={leaveGroup}
                disabled={pending}
                style={dangerOutlineBtn}
              >
                <LogOut size={15} /> Sair do grupo
              </button>
              {meIsAdmin && (
                <button onClick={deleteGroup} disabled={pending} style={dangerBtn}>
                  <Trash2 size={15} /> Apagar grupo
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "add" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {picked.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {picked.map((p) => (
                  <span key={p.id} style={chipPicked}>
                    @{p.username}
                    <button onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} style={{ background: "none", border: "none", color: "#C49BFF", cursor: "pointer", padding: 0, display: "flex" }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar butico..."
              autoFocus
              style={{
                background: "var(--surface-up)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "11px 14px",
                color: "var(--text)",
                fontSize: 14,
                outline: "none"
              }}
            />

            <div style={{ flex: 1, overflowY: "auto" }}>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setPicked([...picked, r]); setSearch(""); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 10
                  }}
                >
                  <Avatar src={r.avatar_url} seed={r.username} initial={r.display_name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.display_name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>@{r.username}</div>
                  </div>
                  <Plus size={16} color="#C49BFF" />
                </button>
              ))}
              {results.length === 0 && search && (
                <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>nenhum match</div>
              )}
            </div>

            {err && <div style={{ color: "#FF6A9E", fontSize: 13 }}>{err}</div>}

            <button
              onClick={addPicked}
              disabled={pending || picked.length === 0}
              className="fire-bg"
              style={{ padding: 12, borderRadius: 12, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: pending ? "wait" : "pointer", opacity: picked.length === 0 || pending ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Check size={14} /> {pending ? "Adicionando..." : `Adicionar ${picked.length}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  alignItems: "center"
};

const chipPicked: React.CSSProperties = {
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
};

const dangerOutlineBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "11px 14px",
  borderRadius: 12,
  background: "transparent",
  border: "1px solid var(--border)",
  color: "#FF6A9E",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14
};

const dangerBtn: React.CSSProperties = {
  ...dangerOutlineBtn,
  background: "rgba(255,106,158,0.10)",
  border: "1px solid rgba(255,106,158,0.4)",
  color: "#FF6A9E"
};
