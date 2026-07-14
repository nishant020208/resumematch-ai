import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { FileDrop } from "@/components/file-drop";
import { KeywordChips } from "@/components/keyword-chips";
import { PrivacyBadge } from "@/components/privacy-badge";
import { analyze, type AnalyzeResult } from "@/lib/analyze";
import { initModel, onProgress } from "@/lib/embed-client";
import { Plus, Trash2, Play, Loader2, ChevronDown, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/batch")({
  head: () => ({ meta: [{ title: "Batch compare — ResumeMatch AI" }, { name: "description", content: "Score one resume against multiple job descriptions on-device." }] }),
  component: Batch,
});

type Row = { id: string; title: string; jd: string; result?: AnalyzeResult; error?: string; running?: boolean };
const uid = () => Math.random().toString(36).slice(2, 9);

function Batch() {
  const [resume, setResume] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { id: uid(), title: "JD #1", jd: "" },
    { id: uid(), title: "JD #2", jd: "" },
  ]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ status: string; progress?: number } | null>(null);

  useEffect(() => onProgress(setProgress), []);
  useEffect(() => { initModel().catch(() => {}); }, []);

  const update = (id: string, patch: Partial<Row>) => setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const add = () => setRows(rs => [...rs, { id: uid(), title: `JD #${rs.length + 1}`, jd: "" }]);
  const remove = (id: string) => setRows(rs => rs.filter(r => r.id !== id));

  const runAll = async () => {
    if (!resume.trim()) { toast.error("Paste your resume first."); return; }
    const active = rows.filter(r => r.jd.trim());
    if (active.length === 0) { toast.error("Add at least one JD."); return; }
    setRunning(true);
    setRows(rs => rs.map(r => r.jd.trim() ? { ...r, running: true, result: undefined, error: undefined } : r));
    // Run sequentially to keep memory / worker load reasonable
    for (const row of active) {
      try {
        const result = await analyze(resume, row.jd);
        update(row.id, { result, running: false });
      } catch (e: any) {
        update(row.id, { error: e?.message ?? "Failed", running: false });
      }
    }
    setRunning(false);
    toast.success("Batch complete.");
  };

  const ranked = [...rows]
    .filter(r => r.result)
    .sort((a, b) => (b.result!.score - a.result!.score));

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold sm:text-3xl">/ batch</h1>
            <p className="mt-1 text-sm text-muted-foreground">Score one resume against multiple JDs — all in-browser.</p>
          </div>
          <PrivacyBadge compact />
        </div>

        <div className="surface-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">your resume</div>
            <FileDrop label=".pdf .docx .txt" onText={setResume} />
          </div>
          <textarea value={resume} onChange={e => setResume(e.target.value)}
            placeholder="Paste resume text…"
            className="h-48 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs" />
        </div>

        <div className="mt-6 space-y-4">
          {rows.map((r, i) => (
            <TiltCard key={r.id}>
              <div className="mb-2 flex items-center gap-3">
                <input value={r.title} onChange={e => update(r.id, { title: e.target.value })}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs" />
                {rows.length > 1 && (
                  <button onClick={() => remove(r.id)} className="p-2 text-muted-foreground hover:text-[color:var(--danger)]" aria-label={`Remove ${r.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <textarea value={r.jd} onChange={e => update(r.id, { jd: e.target.value })}
                placeholder={`Paste job description #${i + 1}…`}
                className="h-32 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs" />
            </TiltCard>
          ))}
          <button onClick={add} className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 font-mono text-xs text-muted-foreground hover:text-foreground">
            <Plus className="h-3 w-3" /> add another JD
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={runAll} disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-5 py-2.5 font-mono text-sm font-semibold text-[color:var(--acid-foreground)] disabled:opacity-60 acid-glow">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "running batch…" : `analyze ${rows.filter(r => r.jd.trim()).length} JD(s)`}
          </button>
          {progress && progress.status !== "ready" && (
            <span className="font-mono text-xs text-muted-foreground">
              loading model{progress.progress != null ? ` · ${Math.round(progress.progress)}%` : "…"}
            </span>
          )}
        </div>

        {ranked.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Layers className="h-3 w-3 text-[color:var(--acid)]" /> ranked results
            </div>
            <div className="overflow-hidden surface-card">
              <table className="w-full text-left">
                <thead className="bg-surface-2/60 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">jd</th>
                    <th className="px-4 py-2 text-right">score</th>
                    <th className="px-4 py-2 text-right">gaps</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ranked.map((r, i) => {
                    const open = expanded === r.id;
                    const score = r.result!.score;
                    return (
                      <>
                        <tr key={r.id} className="cursor-pointer hover:bg-surface-2/40" onClick={() => setExpanded(open ? null : r.id)}>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-3 text-sm">{r.title}</td>
                          <td className="px-4 py-3 text-right font-mono text-lg tabular-nums" style={{ color: score >= 75 ? "var(--success)" : score >= 55 ? "var(--acid)" : "var(--warn)" }}>{score}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r.result!.missing.length}</td>
                          <td className="px-2 py-3 text-muted-foreground"><ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} /></td>
                        </tr>
                        <AnimatePresence initial={false}>
                          {open && (
                            <tr key={r.id + "-x"}>
                              <td colSpan={5} className="bg-surface-2/30 p-4">
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <div className="mb-2 font-mono text-[10px] uppercase text-[color:var(--success)]">matched ({r.result!.matched.length})</div>
                                      <KeywordChips items={r.result!.matched.slice(0, 20)} variant="matched" />
                                    </div>
                                    <div>
                                      <div className="mb-2 font-mono text-[10px] uppercase text-[color:var(--danger)]">missing ({r.result!.missing.length})</div>
                                      <KeywordChips items={r.result!.missing.slice(0, 20)} variant="missing" />
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.some(r => r.error) && (
          <div className="mt-4 rounded-md border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 p-3 font-mono text-xs text-[color:var(--danger)]">
            {rows.filter(r => r.error).map(r => <div key={r.id}>{r.title}: {r.error}</div>)}
          </div>
        )}
      </div>
    </PageShell>
  );
}