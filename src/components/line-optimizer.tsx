import { useState } from "react";
import { optimizeLine, type LineSuggestion } from "@/lib/line-optimize";
import { toast } from "sonner";
import { Wand2, Loader2, Copy, X } from "lucide-react";

export function LineOptimizer({
  resume,
  missing,
  jdVector,
}: {
  resume: string;
  missing: { keyword: string; count: number }[];
  jdVector: number[];
}) {
  const [open, setOpen] = useState(false);
  const lines = resume.split(/\r?\n/).map(l => l.trim()).filter(l => l.length >= 30).slice(0, 60);
  const [active, setActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ original: { text: string; score: number }; suggestions: LineSuggestion[] } | null>(null);

  const optimize = async (i: number) => {
    setActive(i); setLoading(true); setResult(null);
    try {
      const r = await optimizeLine(lines[i], missing.map(m => m.keyword), jdVector);
      setResult(r);
    } catch (e: any) { toast.error(e?.message ?? "Optimize failed"); }
    finally { setLoading(false); }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied."); } catch { toast.error("Copy failed"); }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-3 w-3 text-[color:var(--acid)]" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">optimize a line</h3>
        </div>
        <button onClick={() => setOpen(o => !o)} className="rounded-md border border-border bg-surface-2 px-3 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground">
          {open ? "hide" : "show"}
        </button>
      </div>
      {open && (
        <>
          {lines.length === 0 ? (
            <p className="text-xs text-muted-foreground">No optimizable lines detected (need ≥30 chars).</p>
          ) : (
            <div className="rounded-md border border-border/60 bg-surface-2/40 p-2 max-h-72 overflow-auto space-y-1">
              {lines.map((l, i) => (
                <button
                  key={i}
                  onClick={() => optimize(i)}
                  className={`block w-full text-left rounded px-2 py-1.5 font-mono text-xs hover:bg-[color:var(--acid)]/10 hover:text-foreground transition-colors ${active === i ? "bg-[color:var(--acid)]/15 text-foreground" : "text-muted-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          {active !== null && (
            <div className="mt-4 rounded-md border border-[color:var(--acid)]/40 bg-surface-2/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--acid)]">alternative phrasings</span>
                <button onClick={() => { setActive(null); setResult(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
              {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> scoring against JD…</div>}
              {result && (
                <div className="space-y-3">
                  <div className="text-[11px] text-muted-foreground">Original: <span className="tabular-nums text-foreground">{result.original.score}%</span></div>
                  {result.suggestions.length === 0 && <p className="text-xs text-muted-foreground">No relevant keyword injections found — this line may already cover the JD well.</p>}
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="rounded-md border border-border bg-background p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          score <span className="tabular-nums text-foreground">{s.score}%</span>
                          <span className={`ml-2 ${s.improvement > 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                            {s.improvement >= 0 ? "+" : ""}{s.improvement}%
                          </span>
                        </span>
                        <button onClick={() => copy(s.text)} className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /> copy</button>
                      </div>
                      <p className="font-mono text-xs leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}