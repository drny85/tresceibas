"use client";

import { useEffect, useRef, useState } from "react";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up to `value` the first time it scrolls into view, then eases to
 * each new value (a donation arriving live). Shows the final number at once
 * when the phone asks for reduced motion.
 */
export function CountUp({ value, format, duration = 1200 }: { value: number; format: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const run = () => {
      started.current = true;
      const start = performance.now();
      const a = from.current;
      if (reduceMotion()) {
        from.current = value;
        setShown(value);
        return;
      }
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const n = a + (value - a) * eased;
        from.current = n;
        setShown(n);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    if (started.current) {
      run();
      return () => cancelAnimationFrame(frame);
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        run();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular">
      {/* Screen readers get the real number, not every frame. */}
      <span aria-hidden>{format(Math.round(shown))}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
