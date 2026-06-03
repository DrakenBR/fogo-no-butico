import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MyProfileRedirect() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/perfil");
  const { data: me } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (!me?.username) redirect("/onboarding");
  redirect(`/perfil/${me.username}`);
}
