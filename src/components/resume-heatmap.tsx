import { useState } from "react";
import type { LineScore } from "@/lib/analyze";

export function ResumeHeatmap({ lines }: { lines: LineScore[] }) {
  const [open, setOpen] = useState(false);
  if (!lines.length) return null;

  const min = Math.min(...lines.map(l => l.score));
  const max = Math.max(...lines.map(l => l.score));
  const range = Math.max(1, max - min);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">resume heatmap</h3>
        <button
          onClick={() => setOpen(o => !o)}
          className="rounded-md border border-border bg-surface-2 px-3 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground"
        >
          {open ? "hide" : "show"}
        </button>
      </div>
      {open && (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Each line's local embedding is scored against the JD. Darker = more relevant to this role.
          </p>
          <div className="rounded-md border border-border/60 bg-surface-2/40 p-3 max-h-96 overflow-auto space-y-1">
            {lines.map((l, i) => {
              const norm = (l.score - min) / range; // 0..1
              const alpha = 8 + Math.round(norm * 55); // 8%..63%
              return (
                <div
                  key={i}
                  className="rounded px-2 py-1 font-mono text-xs leading-relaxed"
                  style={{ background: `color-mix(in oklch, var(--acid) ${alpha}%, transparent)` }}
                  title={`${l.score}% match`}
                >
                  <span className="mr-2 text-[10px] tabular-nums opacity-60">{l.score}%</span>
                  {l.text}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>low</span>
            <div className="h-2 flex-1 rounded-full" style={{ background: "linear-gradient(to right, color-mix(in oklch, var(--acid) 8%, transparent), color-mix(in oklch, var(--acid) 63%, transparent))" }} />
            <span>high</span>
          </div>
        </>
      )}
    </div>
  );
}