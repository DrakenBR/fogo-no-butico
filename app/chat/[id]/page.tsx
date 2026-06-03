import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { ChatThread } from "./ChatThread";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/chat/${params.id}`);

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, user_a, user_b")
    .eq("id", params.id)
    .maybeSingle();
  if (!conv) notFound();

  const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, city")
    .eq("id", otherId)
    .maybeSingle();
  if (!other) notFound();

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, read_at, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <AppShell>
      <ChatThread
        conversationId={params.id}
        meId={user.id}
        other={other}
        initialMessages={msgs ?? []}
      />
    </AppShell>
  );
}
