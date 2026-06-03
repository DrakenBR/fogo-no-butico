import { avatarGradient } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  seed?: string | null;
  initial?: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({ src, seed, initial, size = 44, ring = false, className }: AvatarProps) {
  const ch = (initial ?? seed ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={className}
      style={{
        padding: ring ? 2.5 : 0,
        borderRadius: "50%",
        background: ring
          ? "linear-gradient(135deg, #FF1B6B 0%, #FF6A3D 60%, #FFB13D 100%)"
          : "transparent",
        display: "inline-block"
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: src ? `center / cover no-repeat url(${src}), ${avatarGradient(seed)}` : avatarGradient(seed),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Anton, sans-serif",
          fontSize: size * 0.4,
          color: "#fff",
          border: ring ? "2.5px solid #0D0D0F" : "none",
          overflow: "hidden"
        }}
      >
        {!src && ch}
      </div>
    </div>
  );
}
