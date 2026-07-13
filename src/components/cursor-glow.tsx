import { useEffect, useRef } from "react";
import { usePointerFine } from "@/hooks/use-pointer-fine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function CursorGlow() {
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fine || reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    const move = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener("mousemove", move);
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.background = `radial-gradient(500px circle at ${cx}px ${cy}px, color-mix(in oklch, var(--acid) 14%, transparent), transparent 65%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, [fine, reduced]);
  if (!fine || reduced) return null;
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1] opacity-70 mix-blend-screen" />;
}