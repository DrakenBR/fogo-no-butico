import { redirect } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { TriviaUI } from "./TriviaUI";

export const dynamic = "force-dynamic";

export default async function TriviaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trivia");

  const { data } = await supabase.rpc("todays_trivia");
  const trivia = (data ?? [])[0] as any | undefined;

  return (
    <AppShell>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <HelpCircle size={26} color="#FFB13D" />
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>
            TRIVIA <span style={{ color: "#FFB13D" }}>DO DIA</span>
          </h1>
        </div>

        {trivia ? (
          <TriviaUI
            questionId={trivia.id}
            question={trivia.question}
            options={trivia.options as string[]}
            totalAnswers={trivia.total_answers}
            myChoice={trivia.my_choice}
            myIsPublic={trivia.my_is_public ?? null}
            counts={trivia.counts as Record<string, number>}
          />
        ) : (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
            Sem pergunta hoje. Volta amanhã 🔥
          </div>
        )}
      </div>
    </AppShell>
  );
}
