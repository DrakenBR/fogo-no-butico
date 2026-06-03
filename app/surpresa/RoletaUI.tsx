"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Flame, RotateCw, MapPin } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { lookingStyle } from "@/lib/utils";
import type { LookingFor } from "@/types/database";

const RADIUS_OPTIONS = [
  { label: "Sem limite", km: null },
  { label: "50km", km: 50 },
  { label: "100km", km: 100 },
  { label: "500km", km: 500 }
];

interface RoletaProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  looking_for: LookingFor;
  distance_km: number | null;
}

export function RoletaUI() {
  const [radius, setRadius] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [profile, setProfile] = useState<RoletaProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  const spin = () => {
    setSpinning(true);
    setErr(null);
    setTimeout(() => setSpinning(false), 600);
    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("random_butico", { radius_km: radius });
      if (error) {
        setErr(error.message);
        return;
      }
      const r = (data ?? [])[0] as RoletaProfile | undefined;
      if (!r) {
        setErr("Não achei ninguém nesse raio 😢");
        setProfile(null);
        return;
      }
      setProfile(r);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
          <MapPin size={14} color="#FF1B6B" /> Raio
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RADIUS_OPTIONS.map((opt) => {
            const active = radius === opt.km;
            return (
              <button
                key={opt.label}
                onClick={() => setRadius(opt.km)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: active ? "rgba(255,27,107,0.15)" : "var(--surface-up)",
                  border: active ? "1px solid #FF1B6B" : "1px solid var(--border-soft)",
                  color: active ? "#FF1B6B" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="fire-bg"
        style={{
          padding: "18px 24px",
          borderRadius: 16,
          border: "none",
          color: "#fff",
          fontWeight: 700,
          fontSize: 18,
          cursor: spinning ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "0 8px 30px rgba(255,27,107,0.4)"
        }}
      >
        <RotateCw size={20} style={{ animation: spinning ? "spin .6s linear" : "none" }} />
        SURPREENDA-ME 🎲
        <Flame size={20} fill="#fff" />
        <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(720deg); } }`}</style>
      </button>

      {err && <div style={{ color: "#FF6A9E", textAlign: "center", padding: 12 }}>{err}</div>}

      {profile && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12
          }}
        >
          <Avatar src={profile.avatar_url} seed={profile.username} initial={profile.display_name} size={100} ring />
          <div style={{ textAlign: "center" }}>
            <div className="display" style={{ fontSize: 22 }}>{profile.display_name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>@{profile.username}</div>
            {profile.city && (
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                {profile.city}
                {profile.distance_km !== null && ` · ${Math.round(profile.distance_km)}km de ti`}
              </div>
            )}
          </div>
          <span style={{ background: lookingStyle[profile.looking_for].bg, color: lookingStyle[profile.looking_for].color, fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 999 }}>
            {lookingStyle[profile.looking_for].label}
          </span>
          <Link
            href={`/perfil/${profile.username}`}
            className="fire-bg"
            style={{
              padding: "12px 22px",
              borderRadius: 12,
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Flame size={16} /> Ver o butico
          </Link>
        </div>
      )}
    </div>
  );
}
