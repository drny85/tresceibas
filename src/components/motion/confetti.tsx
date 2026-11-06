"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#002D62", "#CE1126", "#2E7D4F", "#F2B544", "#FFF7E8"];

/** A short burst of confetti in the community's colours. Skipped with reduced motion. */
export function Confetti({ pieces = 140, duration = 3200 }: { pieces?: number; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const w = () => canvas.width;
    const parts = Array.from({ length: pieces }, (_, i) => ({
      x: w() * (0.5 + (Math.random() - 0.5) * 0.3),
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 18 * dpr,
      vy: (-Math.random() * 16 - 6) * dpr,
      size: (6 + Math.random() * 6) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[i % COLORS.length],
    }));
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - duration * 0.7) / (duration * 0.3));
      for (const p of parts) {
        p.vy += 0.45 * dpr;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (t < duration) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [pieces, duration]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 size-full" />;
}
