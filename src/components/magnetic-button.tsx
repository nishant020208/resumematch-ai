import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { usePointerFine } from "@/hooks/use-pointer-fine";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  strength?: number;
  radius?: number;
  as?: "button";
};

/** Cursor-magnetic button. Falls back to a plain button on touch / reduced motion. */
export function MagneticButton({ children, className, strength = 0.35, radius = 90, onMouseMove, onMouseLeave, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const move = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(e);
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) { ref.current.style.transform = ""; return; }
    ref.current.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };
  const leave = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e);
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <button
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      className={className}
      style={{ transition: "transform .35s cubic-bezier(.2,.9,.2,1)" }}
      {...rest}
    >
      {children}
    </button>
  );
}