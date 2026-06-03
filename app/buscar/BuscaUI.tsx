"use client";

import { Search, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { lookingStyle } from "@/lib/utils";
import type { LookingFor, SearchProfileRow } from "@/types/database";

const RADIUS_STEPS = [10, 25, 50, 100, 250, 500, 1000];

export function BuscaUI() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<LookingFor | "todos">("todos");
  const [radius, setRadius] = useState<number | null>(null);
  const [rows, setRows] = useState<SearchProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState<boolean | null>(null);

  // checa se o user tem lat/lng setados
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasLocation(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("lat, lng")
        .eq("id", user.id)
        .maybeSingle();
      setHasLocation(!!(data?.lat && data?.lng));
    })();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let canceled = false;
    setLoading(true);

    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_profiles", {
        q: q.trim() || null,
        looking: filter === "todos" ? null : filter,
        radius_km: radius,
        result_limit: 60
      });
      if (canceled) return;
      if (error) {
        setRows([]);
      } else {
        setRows(((data ?? []) as unknown as SearchProfileRow[]));
      }
      setLoading(false);
    }, 250);

    return () => {
      canceled = true;
      clearTimeout(handle);
    };
  }, [q, filter, radius]);

  const filters = useMemo(
    () => [
      { id: "todos" as const, label: "todos" },
      { id: "marido" as const, label: "💍 marido" },
      { id: "amante" as const, label: "💋 amante" },
      { id: "zoeira" as const, label: "🍻 zoeira" }
    ],
    []
  );

  return (
    <div style={{ padding: 22 }}>
      <h1 className="display" style={{ fontSize: 28, marginBottom: 16 }}>
        ACHA UM <span style={{ color: "#FF1B6B" }}>BUTICO</span>
      </h1>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={18} color="var(--text-muted)" style={{ position: "absolute", top: 14, left: 14 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="username, nome ou cidade"
          style={{
            width: "100%",
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "13px 14px 13px 42px",
            color: "var(--text)",
            fontSize: 15,
            outline: "none"
          }}
        />
      </div>

      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: active ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(255,27,107,0.15)" : "var(--surface)",
                color: active ? "#FF1B6B" : "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {hasLocation === false && (
        <div style={{ background: "rgba(255,177,61,0.08)", border: "1px solid rgba(255,177,61,0.25)", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color="#FFB13D" />
          <span>
            <span style={{ color: "var(--text)" }}>Opcional:</span> pra filtrar por raio,{" "}
            <Link href="/onboarding" style={{ color: "#FFB13D", fontWeight: 700, textDecoration: "underline" }}>
              ativa tua localização
            </Link>
          </span>
        </div>
      )}

      {hasLocation && (
        <div style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600 }}>
              <MapPin size={15} color="#FF1B6B" />
              {radius ? `Raio: ${radius} km` : "Sem filtro de distância"}
            </div>
            {radius && (
              <button
                onClick={() => setRadius(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                limpar
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RADIUS_STEPS.map((km) => {
              const active = radius === km;
              return (
                <button
                  key={km}
                  onClick={() => setRadius(active ? null : km)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: active ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.06)",
                    background: active ? "rgba(255,27,107,0.15)" : "var(--surface-up)",
                    color: active ? "#FF1B6B" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {km}km
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Procurando...</div>}
      {!loading && rows.length === 0 && (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>Ninguém aqui pra esse filtro 🔥</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((p) => {
          const tag = lookingStyle[p.looking_for];
          return (
            <Link
              key={p.user_id}
              href={`/perfil/${p.username}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 8px",
                borderRadius: 12,
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <Avatar src={p.avatar_url} seed={p.username} initial={p.display_name} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.display_name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  @{p.username} {p.city ? `· ${p.city}` : ""}
                </div>
              </div>
              {p.distance_km !== null && (
                <div style={{ color: "var(--text-muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={11} /> {p.distance_km < 1 ? "<1" : Math.round(p.distance_km)}km
                </div>
              )}
              <span style={{ background: tag.bg, color: tag.color, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999 }}>
                {tag.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
