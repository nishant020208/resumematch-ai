import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li";
};

/** Scroll-triggered reveal (fade + slight upward slide). Fires once. */
export function Reveal({ children, delay = 0, y = 16, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const Tag = as as any;
  if (reduced) {
    return <Tag ref={ref} className={className}>{children}</Tag>;
  }
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.2,.9,.2,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}