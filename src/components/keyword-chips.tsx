import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function KeywordChips({
  items,
  variant,
}: {
  items: { keyword: string; count: number }[];
  variant: "matched" | "missing";
}) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None detected.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <motion.span
          key={it.keyword}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025, duration: 0.25, ease: "easeOut" }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono border transition-transform hover:-translate-y-0.5 active:scale-95",
            variant === "matched"
              ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/10 text-[color:var(--success)]"
              : "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 text-[color:var(--danger)]"
          )}
        >
          {it.keyword}
          <span className="text-[10px] opacity-70">×{it.count}</span>
        </motion.span>
      ))}
    </div>
  );
}