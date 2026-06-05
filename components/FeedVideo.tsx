"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

const MAX_LOOPS = 3;

interface Props {
  src: string;
  /** estilo aplicado no <video> (cover, aspectRatio etc) */
  style?: React.CSSProperties;
}

/**
 * Vídeo do feed estilo TikTok/Instagram:
 * - autoplay mudo ao entrar na viewport (IntersectionObserver)
 * - repete 3x e para, mostrando botão de replay
 * - tap alterna mudo/desmudo, sem barra de controles
 */
export function FeedVideo({ src, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const loopsRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [inView, setInView] = useState(false);

  // play/pause conforme visibilidade
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        setInView(visible);
        const v = videoRef.current;
        if (!v) return;
        if (visible) {
          if (!ended) v.play().catch(() => {});
        } else {
          v.pause();
          // reseta o contador de loops ao sair da tela
          loopsRef.current = 0;
          if (ended) {
            setEnded(false);
            v.currentTime = 0;
          }
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [ended]);

  const onEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    loopsRef.current += 1;
    if (loopsRef.current < MAX_LOOPS) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      setEnded(true);
    }
  };

  const replay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    loopsRef.current = 0;
    setEnded(false);
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next && v.paused && inView && !ended) v.play().catch(() => {});
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }} onClick={toggleMute}>
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        playsInline
        preload="metadata"
        onEnded={onEnded}
        style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block", background: "#000", ...style }}
      />

      {/* botão mudo/desmudo */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        aria-label={muted ? "Ativar som" : "Mutar"}
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          background: "rgba(0,0,0,0.55)",
          border: "none",
          borderRadius: "50%",
          width: 34,
          height: 34,
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* overlay de replay após 3 loops */}
      {ended && (
        <button
          onClick={replay}
          aria-label="Repetir"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              backdropFilter: "blur(4px)"
            }}
          >
            <Play size={26} fill="#fff" style={{ marginLeft: 3 }} />
          </span>
        </button>
      )}
    </div>
  );
}
