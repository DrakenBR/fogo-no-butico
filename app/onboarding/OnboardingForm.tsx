"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { LinkIcon } from "@/components/LinkIcon";
import { PushNotificationsButton } from "@/components/PushNotificationsButton";
import { compressImage, slugify } from "@/lib/utils";
import { LINK_TYPES, type LinkType, type LookingFor, type ProfileLink } from "@/types/database";

interface Props {
  initialUsername: string;
  initialDisplayName: string;
  initialCity: string;
  initialAge: number | null;
  initialLookingFor: LookingFor;
  initialBio: string;
  initialLinks: ProfileLink[];
  initialLat: number | null;
  initialLng: number | null;
  error?: string;
}

const MAX_LINKS = 4;

export function OnboardingForm({
  initialUsername,
  initialDisplayName,
  initialCity,
  initialAge,
  initialLookingFor,
  initialBio,
  initialLinks,
  initialLat,
  initialLng,
  error
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errMsg, setErrMsg] = useState<string | null>(error ?? null);

  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [city, setCity] = useState(initialCity);
  const [age, setAge] = useState<string>(initialAge?.toString() ?? "");
  const [lookingFor, setLookingFor] = useState<LookingFor>(initialLookingFor);
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<ProfileLink[]>(initialLinks);
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [geoStatus, setGeoStatus] = useState<"idle" | "asking" | "ok" | "err">(
    initialLat !== null && initialLng !== null ? "ok" : "idle"
  );
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const useLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("err");
      setGeoErr("Browser não tem GPS");
      return;
    }
    setGeoStatus("asking");
    setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setGeoStatus("ok");
      },
      (err) => {
        setGeoStatus("err");
        setGeoErr(err.message);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  const clearLocation = () => {
    setLat(null);
    setLng(null);
    setGeoStatus("idle");
  };

  const onAvatar = (f: File | null) => {
    setAvatarFile(f);
    setAvatarPreview(f ? URL.createObjectURL(f) : null);
  };

  const addLink = () => {
    if (links.length >= MAX_LINKS) return;
    const used = new Set(links.map((l) => l.type));
    const firstFree = (LINK_TYPES.find((t) => !used.has(t.id)) ?? LINK_TYPES[0]).id;
    setLinks([...links, { type: firstFree, url: "" }]);
  };

  const updateLink = (idx: number, patch: Partial<ProfileLink>) => {
    setLinks(links.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);

    const cleanUsername = slugify(username || displayName);
    const ageNum = age ? parseInt(age, 10) : null;
    if (!cleanUsername) return setErrMsg("Escolhe um username válido");
    if (!displayName.trim()) return setErrMsg("Põe um nome bonito aí");
    if (ageNum != null && (isNaN(ageNum) || ageNum < 18 || ageNum > 120)) {
      return setErrMsg("Idade tem que ser entre 18 e 120");
    }

    // valida links: dropa os vazios e checa duplicatas / urls grandes
    const cleanLinks: ProfileLink[] = [];
    for (const l of links) {
      const url = l.url.trim();
      if (!url) continue;
      if (url.length > 500) return setErrMsg("Algum link tá longo demais (max 500 chars)");
      cleanLinks.push({ type: l.type, url });
    }
    if (cleanLinks.length > MAX_LINKS) return setErrMsg(`Máximo ${MAX_LINKS} links`);

    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      let avatarUrl: string | null = null;
      if (avatarFile) {
        const blob = await compressImage(avatarFile, 600, 0.85);
        const path = `${user.id}/avatar-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (upErr) return setErrMsg(`Upload falhou: ${upErr.message}`);
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const { error: upsertErr } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          display_name: displayName.trim(),
          city: city.trim(),
          age: ageNum,
          looking_for: lookingFor,
          bio: bio.trim(),
          links: cleanLinks,
          lat,
          lng,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {})
        })
        .eq("id", user.id);

      if (upsertErr) {
        if (upsertErr.code === "23505") return setErrMsg("Esse username já tá tomado, escolhe outro");
        return setErrMsg(upsertErr.message);
      }

      router.push(`/perfil/${cleanUsername}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <Avatar src={avatarPreview} seed={username || displayName} initial={displayName || "?"} size={72} ring />
        <div>
          <div style={{ fontWeight: 700 }}>Foto de perfil</div>
          <div style={{ color: "#9A9AA0", fontSize: 13 }}>toque pra escolher</div>
        </div>
        <input type="file" accept="image/*" onChange={(e) => onAvatar(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
      </label>

      <Field label="Username">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu_butico" maxLength={24} required style={inputStyle} />
      </Field>

      <Field label="Nome">
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como te chamam" maxLength={40} required style={inputStyle} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Field label="Cidade">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Asunción" maxLength={60} style={inputStyle} />
        </Field>
        <Field label="Idade">
          <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} placeholder="25" maxLength={3} inputMode="numeric" style={inputStyle} />
        </Field>
      </div>

      <Field label="Bio">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="conta uma coisa rápida sobre tu..."
          rows={3}
          maxLength={300}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <Field label="O que tu tá procurando?">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {(["marido", "amante", "zoeira"] as LookingFor[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setLookingFor(opt)}
              style={{
                padding: "12px 8px",
                borderRadius: 12,
                border: lookingFor === opt ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
                background: lookingFor === opt ? "rgba(255,27,107,0.15)" : "#161519",
                color: lookingFor === opt ? "#FF1B6B" : "#F5F5F7",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14
              }}
            >
              {opt === "marido" ? "💍 marido" : opt === "amante" ? "💋 amante" : "🍻 zoeira"}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Notificações push">
        <ClientPushBtn />
      </Field>

      <Field label="Localização (pra busca por raio)">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {geoStatus === "ok" && lat !== null && lng !== null ? (
            <>
              <div style={{ flex: 1, padding: "11px 14px", background: "rgba(255,27,107,0.08)", border: "1px solid rgba(255,27,107,0.25)", borderRadius: 12, color: "#FF1B6B", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={15} /> {lat.toFixed(3)}, {lng.toFixed(3)}
              </div>
              <button type="button" onClick={clearLocation} style={{ padding: "11px 12px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#9A9AA0", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                Limpar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={useLocation}
              disabled={geoStatus === "asking"}
              style={{ flex: 1, padding: "11px 14px", borderRadius: 12, background: "#161519", border: "1px dashed rgba(255,27,107,0.45)", color: "#FF1B6B", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}
            >
              <MapPin size={16} /> {geoStatus === "asking" ? "Pegando GPS..." : "Usar minha localização"}
            </button>
          )}
        </div>
        {geoErr && <div style={{ color: "#FF6A9E", fontSize: 12.5, marginTop: 6 }}>{geoErr}</div>}
        <div style={{ color: "#9A9AA0", fontSize: 12, marginTop: 6 }}>
          Pra outros encontrarem você por proximidade. Compartilha só lat/lng (sem endereço).
        </div>
      </Field>

      <Field label={`Links (até ${MAX_LINKS})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {links.length === 0 && (
            <div style={{ color: "#9A9AA0", fontSize: 13 }}>Sem links ainda. Adiciona pra divulgar teu insta, loja, canal, etc.</div>
          )}
          {links.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", background: "#161519", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
                <LinkIcon type={l.type} size={16} color={LINK_TYPES.find((t) => t.id === l.type)?.color ?? "#FF1B6B"} />
                <select
                  value={l.type}
                  onChange={(e) => updateLink(i, { type: e.target.value as LinkType })}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#F5F5F7",
                    fontSize: 14,
                    padding: "12px 0",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  {LINK_TYPES.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: "#161519" }}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={l.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder={placeholderFor(l.type)}
                maxLength={500}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                aria-label="remover"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  width: 44,
                  color: "#9A9AA0",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {links.length < MAX_LINKS && (
            <button
              type="button"
              onClick={addLink}
              style={{
                marginTop: 4,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px dashed rgba(255,27,107,0.45)",
                background: "rgba(255,27,107,0.06)",
                color: "#FF1B6B",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 14
              }}
            >
              <Plus size={16} /> Adicionar link
            </button>
          )}
        </div>
      </Field>

      {errMsg && <div style={{ color: "#FF6A9E", fontSize: 13.5, textAlign: "center" }}>{errMsg}</div>}

      <button
        type="submit"
        disabled={pending}
        className="fire-bg display"
        style={{
          marginTop: 8,
          padding: 14,
          borderRadius: 14,
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          color: "#fff",
          fontSize: 17,
          letterSpacing: 1,
          opacity: pending ? 0.7 : 1
        }}
      >
        {pending ? "SALVANDO..." : "SALVAR 🔥"}
      </button>
    </form>
  );
}

function placeholderFor(t: LinkType): string {
  switch (t) {
    case "loja": return "https://minhaloja.com";
    case "youtube": return "https://youtube.com/@canal";
    case "instagram": return "https://instagram.com/usuario";
    case "tiktok": return "https://tiktok.com/@usuario";
    case "twitch": return "https://twitch.tv/canal";
    case "discord": return "https://discord.gg/convite";
  }
}

function ClientPushBtn() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);
  if (!userId) return null;
  return <PushNotificationsButton userId={userId} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#9A9AA0" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#161519",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "13px 14px",
  color: "#F5F5F7",
  fontSize: 15,
  outline: "none",
  width: "100%"
};
