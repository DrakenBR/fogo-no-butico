import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { RankingUI } from "./RankingUI";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: cities } = await supabase.rpc("cities_with_users");

  return (
    <AppShell>
      <RankingUI meId={user?.id ?? null} cities={(cities ?? []) as { city: string; total: number }[]} />
    </AppShell>
  );
}
