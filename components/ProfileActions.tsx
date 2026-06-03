"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Flag, Shield, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CrushButton } from "./CrushButton";
import { ReportDialog } from "./ReportDialog";

interface Props {
  targetId: string;
  targetUsername: string;
  targetDisplayName: string;
  targetAvatar: string | null;
  meAvatar: string | null;
  meDisplayName: string;
}

export function ProfileActions({
  targetId,
  targetUsername,
  targetDisplayName,
  targetAvatar,
  meAvatar,
  meDisplayName
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, start] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetId)
        .maybeSingle();
      setBlocked(!!data);
    })();
  }, [targetId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const toggleBlock = () => {
    if (pending) return;
    const next = !blocked;
    setBlocked(next);
    setMenuOpen(false);
    start(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (next) {
        await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetId });
        router.refresh();
      } else {
        await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", targetId);
        router.refresh();
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, flex: 1 }}>
      {!blocked && (
        <CrushButton
          targetId={targetId}
          targetName={targetDisplayName}
          targetAvatar={targetAvatar}
          targetUsername={targetUsername}
          meAvatar={meAvatar}
          meDisplayName={meDisplayName}
        />
      )}
      {blocked && (
        <button
          onClick={toggleBlock}
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9A9AA0",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <ShieldOff size={16} /> Desbloquear
        </button>
      )}

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="mais opções"
          style={{
            padding: "11px 12px",
            borderRadius: 12,
            background: "#161519",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9A9AA0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            height: "100%"
          }}
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "#1E1C22",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              padding: 6,
              minWidth: 200,
              boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
              zIndex: 20
            }}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
              style={menuItem}
            >
              <Flag size={16} /> Denunciar
            </button>
            <button onClick={toggleBlock} style={{ ...menuItem, color: blocked ? "#9A9AA0" : "#FF6A9E" }}>
              <Shield size={16} /> {blocked ? "Desbloquear" : "Bloquear"}
            </button>
          </div>
        )}
      </div>

      {reportOpen && (
        <ReportDialog
          kind="user"
          targetId={targetId}
          targetLabel={`@${targetUsername}`}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

const menuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 8,
  background: "transparent",
  border: "none",
  color: "#F5F5F7",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
  textAlign: "left"
};
