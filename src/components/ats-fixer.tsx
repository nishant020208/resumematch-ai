import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cleanForAts, fixSummary } from "@/lib/ats-fix";
import { Wand2, Check, X } from "lucide-react";
import { toast } from "sonner";

export function AtsFixer({ resume, onApply }: { resume: string; onApply: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const cleaned = useMemo(() => cleanForAts(resume), [resume]);
  const summary = useMemo(() => fixSummary(resume, cleaned), [resume, cleaned]);
  const changed = cleaned !== resume.trim();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          disabled={!changed}
          className="inline-flex items-center gap-2 rounded-md border border-[color:var(--acid)]/50 bg-[color:var(--acid)]/10 px-3 py-1.5 font-mono text-xs text-foreground hover:bg-[color:var(--acid)]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 className="h-3 w-3 text-[color:var(--acid)]" />
          clean for ATS
        </button>
        <span className="font-mono text-[10px] text-muted-foreground">
          {changed ? `${summary.normalizedLines} line(s) will change, ~${summary.removedChars} chars trimmed` : "resume already looks ATS-clean"}
        </span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[9997] grid place-items-center bg-background/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div>
                  <h3 className="font-mono text-sm font-semibold">Clean for ATS — preview</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Bullets normalized, decorative characters removed, tables and columns flattened. Content preserved.</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 max-h-[70vh]">
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">before</div>
                  <pre className="h-[55vh] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{resume}</pre>
                </div>
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--acid)]">after (ATS-safe)</div>
                  <pre className="h-[55vh] overflow-auto whitespace-pre-wrap rounded-md border border-[color:var(--acid)]/40 bg-background p-3 font-mono text-[11px] leading-relaxed">{cleaned}</pre>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-surface-2/40 px-4 py-3">
                <button onClick={() => setOpen(false)} className="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">cancel</button>
                <button
                  onClick={() => { onApply(cleaned); setOpen(false); toast.success("Applied ATS-safe formatting."); }}
                  className="inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-3 py-1.5 font-mono text-xs font-semibold text-[color:var(--acid-foreground)]"
                >
                  <Check className="h-3 w-3" /> apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}