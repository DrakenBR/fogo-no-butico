import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Flame size={40} color="#FF1B6B" fill="#FF1B6B" style={{ margin: "0 auto" }} />
          <h1 className="display" style={{ fontSize: 32, marginTop: 12, lineHeight: 1 }}>
            BORA <span style={{ color: "#FF1B6B" }}>ARRUMAR</span> TEU BUTICO
          </h1>
          <p style={{ color: "#9A9AA0", marginTop: 8 }}>uns dados rapidinho e tu tá no fogo</p>
        </div>

        <OnboardingForm
          initialUsername={profile?.username ?? ""}
          initialDisplayName={profile?.display_name ?? ""}
          initialCity={profile?.city ?? ""}
          initialAge={profile?.age ?? null}
          initialLookingFor={profile?.looking_for ?? "zoeira"}
          initialBio={profile?.bio ?? ""}
          initialLinks={Array.isArray(profile?.links) ? profile.links : []}
          initialLat={profile?.lat ?? null}
          initialLng={profile?.lng ?? null}
          error={searchParams.error}
        />
      </div>
    </div>
  );
}
