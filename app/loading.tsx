import { Flame } from "lucide-react";

export default function Loading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Flame size={48} color="#FF1B6B" fill="#FF1B6B" className="animate-pulse-fire" />
    </div>
  );
}
