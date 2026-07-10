import { useEffect, useRef } from "react";

export function Ambient() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ ["--mx" as any]: "50%", ["--my" as any]: "40%" }}>
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div
        className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, var(--acid), transparent 70%)", transform: "translate(calc(var(--mx) * 0.05), calc(var(--my) * 0.05))" }}
      />
      <div
        className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.15 240), transparent 70%)" }}
      />
    </div>
  );
}