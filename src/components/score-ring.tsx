import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function ScoreRing({ score, size = 220 }: { score: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const [display, setDisplay] = useState(0);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 14 });
  const dash = useTransform(spring, (v) => C * (1 - v / 100));

  useEffect(() => {
    mv.set(score);
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [score, mv, spring]);

  const color = score >= 75 ? "var(--success)" : score >= 55 ? "var(--acid)" : score >= 35 ? "var(--warn)" : "var(--danger)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="color-mix(in oklch, var(--foreground) 10%, transparent)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C}
          style={{ strokeDashoffset: dash, filter: `drop-shadow(0 0 12px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-bold tracking-tight tabular-nums">{display}</span>
        <span className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">match score</span>
      </div>
    </div>
  );
}