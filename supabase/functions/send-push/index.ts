// Supabase Edge Function: send-push
//
// Recebe um POST com { user_id, title, body, url? } e dispara Web Push
// pra todas as subscriptions desse user.
//
// Envs necessárias (no painel do Supabase → Edge Functions → Settings):
//   - SUPABASE_URL          (auto)
//   - SUPABASE_SERVICE_ROLE_KEY (auto)
//   - VAPID_PUBLIC_KEY
//   - VAPID_PRIVATE_KEY
//   - VAPID_SUBJECT (mailto:admin@fogonobutico.com)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

interface PushPayload {
  user_id: string;
  title?: string;
  body?: string;
  url?: string;
}

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@fogonobutico.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("only POST", { status: 405 });
  const payload: PushPayload = await req.json();
  if (!payload.user_id) return new Response("user_id required", { status: 400 });

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", payload.user_id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { "content-type": "application/json" } });
  }

  const data = JSON.stringify({
    title: payload.title ?? "Fogo no Butico",
    body: payload.body ?? "Algo novo no butico 🔥",
    url: payload.url ?? "/"
  });

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth_key }
          },
          data
        );
        sent++;
      } catch (e: any) {
        // 410 = expirada
        if (e.statusCode === 404 || e.statusCode === 410) stale.push(s.id);
      }
    })
  );

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", stale);
  }

  return new Response(JSON.stringify({ sent, removed: stale.length }), {
    headers: { "content-type": "application/json" }
  });
});
