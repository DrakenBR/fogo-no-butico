"use client";

import { Flame, MessageCircle, Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MatchSplash } from "./MatchSplash";
import type { CrushStatus } from "@/types/database";

interface Props {
  targetId: string;
  targetName: string;
  targetAvatar: string | null;
  targetUsername: string;
  meAvatar: string | null;
  meDisplayName: string;
}

export function CrushButton({
  targetId,
  targetName,
  targetAvatar,
  targetUsername,
  meAvatar,
  meDisplayName
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<CrushStatus | null>(null);
  const [splash, setSplash] = useState(false);
  const [pending, start] = useTransition();

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("crush_status", { target: targetId });
    if (data) setStatus(data as unknown as CrushStatus);
  };

  useEffect(() => {
    load();
  }, [targetId]);

  const toggle = () => {
    if (!status || pending) return;
    const isCrushed = status.i_crushed;
    // optimistic
    const wouldMatch = !isCrushed && status.they_crushed;
    setStatus({
      ...status,
      i_crushed: !isCrushed,
      matched: !isCrushed && status.they_crushed
    });

    start(async () => {
      const supabase = createClient();
      if (isCrushed) {
        await supabase.from("crushes").delete().eq("user_id", await meId()).eq("target_id", targetId);
      } else {
        const { error } = await supabase.from("crushes").insert({
          user_id: await meId(),
          target_id: targetId
        });
        if (error) {
          // rollback
          setStatus({ ...status, i_crushed: false, matched: false });
          return;
        }
        if (wouldMatch) {
          setSplash(true);
          await new Promise((r) => setTimeout(r, 100));
          await load(); // pega conversation_id atualizado
          router.refresh();
        }
      }
    });
  };

  if (!status) return null;

  const matched = status.matched;
  const lit = status.i_crushed;

  return (
    <>
      {!matched ? (
        <button
          onClick={toggle}
          disabled={pending}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 16px",
            borderRadius: 12,
            border: lit ? "1px solid #FF1B6B" : "1px solid rgba(255,255,255,0.1)",
            background: lit ? "rgba(255,27,107,0.18)" : "#161519",
            color: lit ? "#FF1B6B" : "#F5F5F7",
            fontWeight: 700,
            fontSize: 14,
            cursor: pending ? "wait" : "pointer"
          }}
        >
          <Flame size={16} fill={lit ? "#FF1B6B" : "none"} />
          {lit ? "Curtido" : "Curtir esse butico"}
        </button>
      ) : (
        <a
          href={status.conversation_id ? `/chat/${status.conversation_id}` : "/chat"}
          className="fire-bg"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 16px",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none"
          }}
        >
          <MessageCircle size={16} /> Mensagem
          <Heart size={13} fill="#fff" />
        </a>
      )}

      {splash && (
        <MatchSplash
          meAvatar={meAvatar}
          meName={meDisplayName}
          otherAvatar={targetAvatar}
          otherName={targetName}
          conversationId={status.conversation_id}
          otherUsername={targetUsername}
          onClose={() => setSplash(false)}
        />
      )}
    </>
  );
}

// helper pra pegar o id do user atual (cache no contexto seria melhor mas pra MVP)
async function meId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user!.id;
}
