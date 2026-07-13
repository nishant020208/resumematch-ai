import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THEMES, type ExportTheme } from "@/lib/export-themes";
import { Download, X, Check } from "lucide-react";

/** Small preview thumbnail (HTML/CSS) for each theme. */
function Thumb({ theme, score }: { theme: ExportTheme; score: number }) {
  if (theme === "minimal") return (
    <div className="h-32 w-full rounded border border-border bg-white p-2 text-[7px] leading-tight text-neutral-900">
      <div className="font-bold text-[9px]">Match Report</div>
      <div className="mt-1 text-[6px] text-neutral-500">2026-01-01 · resume.pdf</div>
      <div className="mt-2 font-bold text-[24px]">{score}</div>
      <div className="mt-1 text-[6px] text-neutral-500">out of 100</div>
    </div>
  );
  if (theme === "modern") return (
    <div className="h-32 w-full overflow-hidden rounded border border-border bg-white text-neutral-900">
      <div className="h-1.5 w-full bg-[#c6ff3d]" />
      <div className="p-2 text-[7px]">
        <div className="font-bold text-[9px]">ResumeMatch AI</div>
        <div className="mt-2 inline-block rounded bg-[#0f1114] px-2 py-1.5 font-bold text-[16px] text-[#c6ff3d]">{score}%</div>
        <div className="mt-2 font-bold text-[6px] text-neutral-500">MATCHED KEYWORDS</div>
      </div>
    </div>
  );
  return (
    <div className="h-32 w-full rounded border border-border bg-[#fdfaf3] p-2 text-center text-[7px] text-neutral-900" style={{ fontFamily: "serif" }}>
      <div className="font-bold text-[9px]">Resume Match Report</div>
      <div className="mx-auto mt-1 h-px w-14 bg-neutral-800" />
      <div className="mt-2 italic text-[6px] text-neutral-500">2026-01-01</div>
      <div className="mt-2 text-left font-bold text-[8px]">Overall Score: {score} / 100</div>
    </div>
  );
}

export function ExportThemePicker({
  score, onExport, buttonLabel = "export pdf",
}: {
  score: number;
  onExport: (theme: ExportTheme) => Promise<void> | void;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExportTheme>("modern");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try { await onExport(selected); setOpen(false); } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs hover:text-foreground">
        <Download className="h-3 w-3" /> {buttonLabel}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[9997] grid place-items-center bg-background/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <h3 className="font-mono text-sm font-semibold">Choose export theme</h3>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setSelected(t.id)}
                    className={`group rounded-md border p-2 text-left transition-colors ${selected === t.id ? "border-[color:var(--acid)] bg-[color:var(--acid)]/8" : "border-border hover:border-border/80"}`}>
                    <Thumb theme={t.id} score={score} />
                    <div className="mt-2 flex items-center justify-between font-mono text-xs">
                      <span className="font-semibold">{t.label}</span>
                      {selected === t.id && <Check className="h-3 w-3 text-[color:var(--acid)]" />}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{t.blurb}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-surface-2/40 px-4 py-3">
                <button onClick={() => setOpen(false)} className="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">cancel</button>
                <button onClick={run} disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-3 py-1.5 font-mono text-xs font-semibold text-[color:var(--acid-foreground)] disabled:opacity-60">
                  <Download className="h-3 w-3" /> {busy ? "rendering…" : "download pdf"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}