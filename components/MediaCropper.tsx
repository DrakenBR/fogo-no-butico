"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import { coverScale, type CropTransform, type FilterPreset, FILTER_PRESETS } from "@/lib/utils";

interface Props {
  /** URL de preview (object URL) da imagem */
  src: string;
  /** dimensões naturais da imagem */
  naturalW: number;
  naturalH: number;
  /** filtro CSS aplicado no preview (não bakeia aqui) */
  filter: FilterPreset;
  /** crop atual */
  crop: CropTransform;
  /** callback ao mudar o crop (pan/zoom) */
  onChange: (crop: CropTransform) => void;
}

/**
 * Editor de enquadramento estilo Instagram: frame fixo 4:5, pan (arrastar) e
 * zoom (slider / wheel / pinch). Mantém a imagem sempre cobrindo o frame.
 */
export function MediaCropper({ src, naturalW, naturalH, filter, crop, onChange }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: crop.frameW || 1, h: crop.frameH || 1 });

  // pointers ativos pra pan/pinch
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStart = useRef<{ x: number; y: number; cropX: number; cropY: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  // mede o frame real
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setFrame({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // garante que o crop reflete o frame medido atual + reclamp
  useEffect(() => {
    if (frame.w <= 1) return;
    if (crop.frameW !== frame.w || crop.frameH !== frame.h) {
      // na primeira medição (frame ainda 0) começa em cover
      const isInit = crop.frameW === 0 || crop.frameH === 0;
      const base = isInit
        ? { ...crop, scale: coverScale(naturalW, naturalH, frame.w, frame.h), x: 0, y: 0 }
        : crop;
      onChange(clamp({ ...base, frameW: frame.w, frameH: frame.h, naturalW, naturalH }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.w, frame.h]);

  const minScale = coverScale(naturalW, naturalH, frame.w, frame.h);
  const maxScale = minScale * 3;

  /** Garante que a imagem cobre o frame (sem buraco): clampa x/y e scale. */
  function clamp(c: CropTransform): CropTransform {
    const scale = Math.min(maxScale, Math.max(minScale, c.scale));
    const drawW = naturalW * scale;
    const drawH = naturalH * scale;
    const maxX = Math.max(0, (drawW - frame.w) / 2);
    const maxY = Math.max(0, (drawH - frame.h) / 2);
    return {
      ...c,
      scale,
      x: Math.min(maxX, Math.max(-maxX, c.x)),
      y: Math.min(maxY, Math.max(-maxY, c.y)),
      frameW: frame.w,
      frameH: frame.h,
      naturalW,
      naturalH
    };
  }

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, cropX: crop.x, cropY: crop.y };
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, scale: crop.scale };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nextScale = pinchStart.current.scale * (dist / pinchStart.current.dist);
      onChange(clamp({ ...crop, scale: nextScale }));
    } else if (dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onChange(clamp({ ...crop, x: dragStart.current.cropX + dx, y: dragStart.current.cropY + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.06 : 0.94;
    onChange(clamp({ ...crop, scale: crop.scale * factor }));
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(clamp({ ...crop, scale: parseFloat(e.target.value) }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{
          position: "relative",
          aspectRatio: "4 / 5",
          width: "100%",
          overflow: "hidden",
          borderRadius: 18,
          background: "#000",
          touchAction: "none",
          cursor: "grab",
          userSelect: "none"
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="enquadramento"
          draggable={false}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: naturalW * crop.scale,
            height: naturalH * crop.scale,
            transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
            filter: FILTER_PRESETS[filter],
            maxWidth: "none",
            pointerEvents: "none"
          }}
        />
        {/* grade de terços (aparece sutil) */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.25 }}>
          <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "#fff" }} />
          <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "#fff" }} />
          <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "#fff" }} />
          <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "#fff" }} />
        </div>
      </div>

      {/* slider de zoom */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
        <ZoomIn size={16} color="var(--text-muted)" />
        <input
          type="range"
          min={minScale}
          max={maxScale}
          step={(maxScale - minScale) / 100 || 0.01}
          value={crop.scale}
          onChange={onSlider}
          style={{ flex: 1, accentColor: "#FF1B6B" }}
        />
      </div>
    </div>
  );
}
