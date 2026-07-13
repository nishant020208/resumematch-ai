import { Flame } from "lucide-react";

export function StreakBadge({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 bg-surface-2/40 px-4 py-3">
      <div className={`grid h-10 w-10 place-items-center rounded-full ${active ? "bg-[color:var(--acid)]/20 text-[color:var(--acid)]" : "bg-surface-2 text-muted-foreground"}`}>
        <Flame className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">practice streak</div>
        <div className="font-mono text-lg font-semibold tabular-nums">
          {streak} <span className="text-xs font-normal text-muted-foreground">day{streak === 1 ? "" : "s"}</span>
        </div>
      </div>
      {active && (
        <div className="flex gap-1">
          {Array.from({ length: Math.min(7, streak) }).map((_, i) => (
            <span key={i} className="h-4 w-1.5 rounded-sm bg-[color:var(--acid)]" style={{ opacity: 0.4 + (i / 7) * 0.6 }} />
          ))}
        </div>
      )}
    </div>
  );
}