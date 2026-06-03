import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { GroupThread } from "./GroupThread";

export const dynamic = "force-dynamic";

export default async function GroupChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/chat/g/${params.id}`);

  // RLS já garante que só vejo grupo se sou membro
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, avatar_url, created_by, created_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!group) notFound();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, is_admin, profile:profiles!group_members_user_id_fkey(username, display_name, avatar_url)")
    .eq("group_id", params.id);

  const { data: msgs } = await supabase
    .from("group_messages")
    .select("id, group_id, sender_id, body, created_at")
    .eq("group_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <AppShell>
      <GroupThread
        groupId={params.id}
        groupName={group.name}
        groupAvatar={group.avatar_url}
        meId={user.id}
        members={(members ?? []) as any}
        initialMessages={msgs ?? []}
      />
    </AppShell>
  );
}
