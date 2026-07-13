import { motion } from "framer-motion";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/achievements";
import { Lock } from "lucide-react";

export function AchievementsGrid({ unlocked }: { unlocked: Set<AchievementCode> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ACHIEVEMENTS.map(a => {
        const on = unlocked.has(a.code);
        return (
          <motion.div
            key={a.code}
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`rounded-md border p-3 transition-colors ${on ? "border-[color:var(--acid)]/50 bg-[color:var(--acid)]/8" : "border-border/60 bg-surface-2/30"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md text-lg ${on ? "bg-[color:var(--acid)]/20" : "bg-surface-2 text-muted-foreground"}`}>
                {on ? a.emoji : <Lock className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className={`font-mono text-xs font-semibold ${on ? "" : "text-muted-foreground"}`}>{a.title}</div>
                <div className="text-[11px] text-muted-foreground">{a.description}</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}