"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaType } from "@/types/database";

interface Props {
  urls: string[];
  types: MediaType[];
  alt?: string;
  bg?: string;
}

export function MediaCarousel({ urls, types, alt = "", bg }: Props) {
  const [idx, setIdx] = useState(0);
  if (urls.length === 0) return null;
  const single = urls.length === 1;
  const url = urls[idx];
  const type = types[idx] ?? "photo";

  return (
    <div style={{ position: "relative", background: bg, overflow: "hidden", borderRadius: "inherit" }}>
      {type === "video" ? (
        <video
          src={url}
          controls
          playsInline
          style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block", background: "#000" }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }} />
      )}

      {!single && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx(idx - 1)}
              aria-label="anterior"
              style={navStyle("left")}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {idx < urls.length - 1 && (
            <button
              onClick={() => setIdx(idx + 1)}
              aria-label="próximo"
              style={navStyle("right")}
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* contador */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            {idx + 1}/{urls.length}
          </div>

          {/* bolinhas */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 4
            }}
          >
            {urls.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === idx ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.5)",
                  transition: "width .2s ease"
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function navStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 8,
    background: "rgba(0,0,0,0.5)",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)"
  };
}
