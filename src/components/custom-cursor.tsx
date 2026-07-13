import { useEffect, useRef, useState } from "react";
import { usePointerFine } from "@/hooks/use-pointer-fine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const HOVER_SELECTOR = 'a, button, [role="button"], input, textarea, select, summary, label, [data-cursor="hover"], .surface-card, .cursor-target';

export function CustomCursor() {
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("rm-cursor-active");
    const move = (e: MouseEvent) => {
      target.current.x = e.clientX; target.current.y = e.clientY;
      if (hidden) setHidden(false);
      const el = e.target as HTMLElement | null;
      const hov = !!el?.closest(HOVER_SELECTOR);
      setHovering(prev => prev === hov ? prev : hov);
    };
    const leave = () => setHidden(true);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    let raf = 0;
    const tick = () => {
      // spring / lerp
      ring.current.x += (target.current.x - ring.current.x) * 0.18;
      ring.current.y += (target.current.y - ring.current.y) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
      document.body.classList.remove("rm-cursor-active");
    };
  }, [enabled, hidden]);

  if (!enabled) return null;
  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--acid)] mix-blend-difference"
        style={{ opacity: hidden ? 0 : 1, transition: "opacity .2s" }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-[color:var(--acid)]"
        style={{
          width: hovering ? 44 : 28,
          height: hovering ? 44 : 28,
          marginLeft: hovering ? -22 : -14,
          marginTop: hovering ? -22 : -14,
          opacity: hidden ? 0 : hovering ? 0.85 : 0.55,
          background: hovering ? "color-mix(in oklch, var(--acid) 12%, transparent)" : "transparent",
          transition: "width .18s ease, height .18s ease, opacity .2s ease, background .18s ease, margin .18s ease",
        }}
      />
    </>
  );
}