import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TiltCard({ children, className, intensity = 8 }: { children: ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glow, setGlow] = useState({ x: "50%", y: "50%", o: 0 });

  const onMove = (e: React.MouseEvent) => {
    // Skip on touch / reduced motion
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * intensity;
    const ry = (px - 0.5) * intensity;
    setStyle({ transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)` });
    setGlow({ x: `${px * 100}%`, y: `${py * 100}%`, o: 1 });
  };
  const reset = () => { setStyle({ transform: "perspective(900px) rotateX(0) rotateY(0)" }); setGlow(g => ({ ...g, o: 0 })); };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn("relative surface-card p-6 transition-transform duration-150 ease-out will-change-transform", className)}
      style={style}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: glow.o * 0.7,
          background: `radial-gradient(300px circle at ${glow.x} ${glow.y}, color-mix(in oklch, var(--acid) 25%, transparent), transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}