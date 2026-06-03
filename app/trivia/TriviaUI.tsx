"use client";

import { useState, useTransition } from "react";
import { Lock, Globe, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  questionId: string;
  question: string;
  options: string[];
  totalAnswers: number;
  myChoice: number | null;
  myIsPublic: boolean | null;
  counts: Record<string, number>;
}

export function TriviaUI({
  questionId,
  question,
  options,
  totalAnswers,
  myChoice,
  myIsPublic,
  counts
}: Props) {
  const router = useRouter();
  const [choice, setChoice] = useState<number | null>(myChoice ?? null);
  const [isPublic, setIsPublic] = useState<boolean>(myIsPublic ?? true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = (optionIdx: number) => {
    if (pending) return;
    setChoice(optionIdx);
    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("trivia_answers")
        .upsert(
          { question_id: questionId, user_id: user.id, option_idx: optionIdx, is_public: isPublic },
          { onConflict: "question_id,user_id" }
        );
      if (error) {
        setErr(error.message);
        return;
      }
      router.refresh();
    });
  };

  const togglePrivacy = () => {
    if (choice === null) {
      setIsPublic(!isPublic);
      return;
    }
    const next = !isPublic;
    setIsPublic(next);
    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("trivia_answers")
        .update({ is_public: next })
        .eq("question_id", questionId)
        .eq("user_id", user.id);
      router.refresh();
    });
  };

  const totalPublic = Object.values(counts).reduce((a, b) => a + b, 0);
  const showResults = choice !== null;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 22
      }}
    >
      <div className="display" style={{ fontSize: 22, marginBottom: 6, color: "#FFB13D", letterSpacing: 0.5 }}>
        PERGUNTA POLÊMICA
      </div>
      <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, marginTop: 6, marginBottom: 18 }}>
        {question}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt, i) => {
          const cnt = counts[String(i)] ?? 0;
          const pct = totalPublic > 0 ? Math.round((cnt / totalPublic) * 100) : 0;
          const mine = choice === i;
          return (
            <button
              key={i}
              onClick={() => submit(i)}
              disabled={pending}
              style={{
                position: "relative",
                padding: "13px 16px",
                borderRadius: 12,
                border: mine ? "1px solid #FFB13D" : "1px solid var(--border)",
                background: "var(--surface-up)",
                color: "var(--text)",
                cursor: "pointer",
                textAlign: "left",
                overflow: "hidden",
                fontSize: 14.5,
                fontWeight: 600
              }}
            >
              {showResults && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${pct}%`,
                    background: mine ? "rgba(255,177,61,0.20)" : "rgba(255,255,255,0.05)",
                    transition: "width .4s ease"
                  }}
                />
              )}
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {mine && <Check size={14} color="#FFB13D" />}
                  {opt}
                </span>
                {showResults && (
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{pct}% · {cnt}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {err && <div style={{ color: "#FF6A9E", fontSize: 13, marginTop: 10 }}>{err}</div>}

      <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {totalAnswers} {totalAnswers === 1 ? "resposta" : "respostas"}
          {totalPublic < totalAnswers ? ` · ${totalAnswers - totalPublic} privada${totalAnswers - totalPublic === 1 ? "" : "s"}` : ""}
        </div>
        <button
          onClick={togglePrivacy}
          disabled={pending}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 999,
            background: isPublic ? "rgba(255,177,61,0.15)" : "var(--surface-up)",
            border: isPublic ? "1px solid #FFB13D" : "1px solid var(--border)",
            color: isPublic ? "#FFB13D" : "var(--text-muted)",
            fontSize: 12,
            fontWeight: 700,
            cursor: pending ? "wait" : "pointer"
          }}
        >
          {isPublic ? <Globe size={13} /> : <Lock size={13} />}
          {isPublic ? "Resposta pública" : "Resposta privada"}
        </button>
      </div>
    </div>
  );
}
