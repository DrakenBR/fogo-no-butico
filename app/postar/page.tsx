import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PostarForm } from "./PostarForm";

export const dynamic = "force-dynamic";

export default async function PostarPage({ searchParams }: { searchParams: { tipo?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/postar");

  const initialTab = searchParams.tipo === "story" ? "story" : "post";

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <h1 className="display" style={{ fontSize: 28, marginBottom: 18 }}>
          BOTAR <span style={{ color: "#FF1B6B" }}>FOGO</span>
        </h1>
        <PostarForm userId={user.id} initialTab={initialTab} />
      </div>
    </AppShell>
  );
}
