import { useEffect, useRef } from "react";
import { usePointerFine } from "@/hooks/use-pointer-fine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Subtle animated gradient mesh with cursor-parallax depth. */
export function HeroMesh() {
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fine || reduced) return;
    const el = ref.current;
    if (!el) return;
    let tx = 0.5, ty = 0.5, cx = 0.5, cy = 0.5, raf = 0;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, [fine, reduced]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ ["--px" as any]: 0.5, ["--py" as any]: 0.4 }}>
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute rounded-full blur-3xl opacity-40" style={{
        width: 620, height: 620, top: "-10%", left: "calc(var(--px) * 30% - 10%)",
        background: "radial-gradient(circle, var(--acid), transparent 65%)",
        transition: "left 0.35s ease-out",
      }} />
      <div className="absolute rounded-full blur-3xl opacity-30" style={{
        width: 520, height: 520, bottom: "-15%", right: "calc((1 - var(--px)) * 25% - 5%)",
        background: "radial-gradient(circle, oklch(0.55 0.18 260), transparent 65%)",
        transition: "right 0.35s ease-out",
      }} />
      <div className="absolute rounded-full blur-3xl opacity-20" style={{
        width: 400, height: 400, top: "calc(var(--py) * 40% + 10%)", left: "calc(var(--px) * 55% + 10%)",
        background: "radial-gradient(circle, oklch(0.78 0.15 60), transparent 65%)",
        transition: "top 0.5s ease-out, left 0.5s ease-out",
      }} />
    </div>
  );
}