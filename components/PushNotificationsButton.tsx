"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export function PushNotificationsButton({ userId }: { userId: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window);
    (async () => {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

  const subscribe = () => {
    if (!supported) {
      setErr("Seu browser não suporta push notifications");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setErr("VAPID_PUBLIC_KEY não configurada — admin precisa setar NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      return;
    }
    start(async () => {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setErr("Permissão negada");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer
        });
        const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setErr("Subscription sem chaves");
          return;
        }
        const supabase = createClient();
        const { error } = await supabase.from("push_subscriptions").upsert(
          {
            user_id: userId,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth_key: json.keys.auth,
            user_agent: navigator.userAgent
          },
          { onConflict: "endpoint" }
        );
        if (error) {
          setErr(error.message);
          return;
        }
        setSubscribed(true);
        setErr(null);
      } catch (e) {
        setErr(String(e));
      }
    });
  };

  const unsubscribe = () => {
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        const supabase = createClient();
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
      setSubscribed(false);
    });
  };

  if (!supported) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={pending}
        style={{
          padding: "11px 14px",
          borderRadius: 12,
          background: subscribed ? "rgba(255,27,107,0.12)" : "#161519",
          border: subscribed ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.08)",
          color: subscribed ? "#FF1B6B" : "#F5F5F7",
          cursor: pending ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: 14
        }}
      >
        {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
        {pending ? "..." : subscribed ? "Desligar push" : "Ativar notificações push"}
      </button>
      {err && <div style={{ color: "#FF6A9E", fontSize: 12 }}>{err}</div>}
    </div>
  );
}
