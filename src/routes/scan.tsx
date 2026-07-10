import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { ScoreRing } from "@/components/score-ring";
import { KeywordChips } from "@/components/keyword-chips";
import { FileDrop } from "@/components/file-drop";
import { PrivacyBadge } from "@/components/privacy-badge";
import { ErrorBoundary } from "@/components/error-boundary";
import { analyze, type AnalyzeResult } from "@/lib/analyze";
import { initModel, onProgress } from "@/lib/embed-client";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, Save, Sparkles, AlertTriangle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "New scan — ResumeMatch AI" }, { name: "description", content: "Paste a resume and a job description. Get a match score, keyword gaps, and rewrite suggestions — all on-device." }] }),
  component: ScanPage,
});

const GUEST_KEY = "rm_guest_scans";

function ScanPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ status: string; progress?: number; file?: string } | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [resumes, setResumes] = useState<{ id: string; name: string; content: string }[]>([]);
  const [pickedResumeId, setPickedResumeId] = useState<string>("");

  useEffect(() => { const unsub = onProgress(setProgress); return () => { unsub; }; }, []);
  useEffect(() => {
    if (!user) return;
    supabase.from("resumes").select("id,name,content").order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) setResumes(data);
    });
  }, [user]);

  useEffect(() => { initModel().catch(console.error); }, []);

  const guestCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(GUEST_KEY) || "0");
  }, [result]);

  const run = async () => {
    if (!resume.trim() || !jd.trim()) { toast.error("Paste both a resume and a job description."); return; }
    if (!user && guestCount >= 1) { toast.error("Free guest scan used. Sign up to keep scanning + save history."); return; }
    setRunning(true); setResult(null);
    try {
      const r = await analyze(resume, jd);
      setResult(r);
      if (user) {
        const chosen = resumes.find(x => x.id === pickedResumeId);
        await supabase.from("scans").insert({
          user_id: user.id,
          resume_id: chosen?.id ?? null,
          resume_name: chosen?.name ?? null,
          resume_text: resume,
          jd_text: jd,
          match_score: r.score,
          matched_keywords: r.matched,
          missing_keywords: r.missing,
          section_scores: r.sectionScores,
          suggestions: r.suggestions,
          ats_issues: r.atsIssues,
        });
      } else {
        localStorage.setItem(GUEST_KEY, String(guestCount + 1));
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Analysis failed");
    } finally { setRunning(false); }
  };

  const pickResume = (id: string) => {
    setPickedResumeId(id);
    const r = resumes.find(x => x.id === id);
    if (r) setResume(r.content);
  };

  const saveResume = async () => {
    if (!user) { toast.error("Sign in to save resumes."); return; }
    if (!resume.trim()) return;
    const name = window.prompt("Name this resume version (e.g. Backend-focused)");
    if (!name) return;
    const { error } = await supabase.from("resumes").insert({ user_id: user.id, name, content: resume });
    if (error) return toast.error(error.message);
    toast.success("Resume saved.");
    supabase.from("resumes").select("id,name,content").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => data && setResumes(data));
  };

  return (
    <PageShell>
      <ErrorBoundary>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate font-mono text-2xl font-bold tracking-tight sm:text-3xl">/ scan</h1>
              <p className="mt-1 text-sm text-muted-foreground">Paste resume + JD. Everything runs in your browser.</p>
            </div>
            <PrivacyBadge compact />
          </div>

          {!user && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 surface-card p-4 text-sm">
              <span className="text-muted-foreground">Guest mode · {Math.max(0, 1 - guestCount)} free scan remaining.</span>
              <Link to="/auth" className="rounded-md bg-[color:var(--acid)] px-3 py-1.5 font-mono text-xs font-semibold text-[color:var(--acid-foreground)]">sign up to save history →</Link>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <FileText className="h-3 w-3 text-[color:var(--acid)]" /> your resume
                </div>
                <div className="flex items-center gap-2">
                  <FileDrop label=".pdf .docx .txt" onText={setResume} />
                  {user && <button onClick={saveResume} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"><Save className="h-3 w-3" />save</button>}
                </div>
              </div>
              {user && resumes.length > 0 && (
                <select value={pickedResumeId} onChange={e => pickResume(e.target.value)}
                  className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs">
                  <option value="">— load a saved resume —</option>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
              <textarea value={resume} onChange={e => setResume(e.target.value)}
                placeholder="Paste resume text here…"
                className="h-72 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--acid)]/50" />
              <div className="mt-2 font-mono text-[10px] text-muted-foreground">{resume.length} chars · {resume.trim().split(/\s+/).filter(Boolean).length} words</div>
            </div>

            <div className="surface-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-[color:var(--acid)]" /> job description
                </div>
                <FileDrop label=".pdf .docx .txt" onText={setJd} />
              </div>
              <textarea value={jd} onChange={e => setJd(e.target.value)}
                placeholder="Paste the job description…"
                className="h-[calc(18rem+37px)] w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--acid)]/50" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={run} disabled={running}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-5 py-2.5 font-mono text-sm font-semibold text-[color:var(--acid-foreground)] transition-all hover:-translate-y-0.5 acid-glow active:scale-95 disabled:opacity-60">
              <Play className="h-4 w-4" /> {running ? "analyzing…" : "analyze"}
            </button>
            {progress && progress.status !== "ready" && (
              <span className="font-mono text-xs text-muted-foreground">
                loading model{progress.progress != null ? ` · ${Math.round(progress.progress)}%` : "…"}
                {progress.file && <> · {progress.file}</>}
              </span>
            )}
          </div>

          {running && !result && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Skeleton className="h-64" /><Skeleton className="h-64 md:col-span-2" />
            </div>
          )}

          {result && <Results r={result} />}
        </div>
      </ErrorBoundary>
    </PageShell>
  );
}

function Results({ r }: { r: AnalyzeResult }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-10 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <TiltCard className="grid place-items-center min-w-[260px]">
          <ScoreRing score={r.score} />
        </TiltCard>
        <TiltCard>
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">section breakdown</h3>
          <div className="mt-4 space-y-3">
            {r.sectionScores.length === 0 && <p className="text-sm text-muted-foreground">No labeled sections detected. Add "Skills", "Experience", "Projects", "Education" headers for section-level scoring.</p>}
            {r.sectionScores.map(s => (
              <div key={s.section}>
                <div className="mb-1 flex items-center justify-between font-mono text-xs">
                  <span className="uppercase tracking-wider">{s.section}</span>
                  <span className="tabular-nums">{s.score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
                    className="h-full" style={{ background: s.score >= 70 ? "var(--success)" : s.score >= 45 ? "var(--acid)" : "var(--warn)" }} />
                </div>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TiltCard>
          <h3 className="font-mono text-xs uppercase tracking-widest text-[color:var(--success)]">matched keywords ({r.matched.length})</h3>
          <div className="mt-4"><KeywordChips items={r.matched} variant="matched" /></div>
        </TiltCard>
        <TiltCard>
          <h3 className="font-mono text-xs uppercase tracking-widest text-[color:var(--danger)]">missing keywords ({r.missing.length})</h3>
          <div className="mt-4"><KeywordChips items={r.missing} variant="missing" /></div>
        </TiltCard>
      </div>

      <TiltCard>
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">suggestions</h3>
        <ul className="mt-4 space-y-2">
          {r.suggestions.length === 0 && <li className="text-sm text-muted-foreground">No suggestions — you're aligned.</li>}
          {r.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-md border border-border/60 bg-surface-2/40 p-3 text-sm">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.severity === "high" ? "bg-[color:var(--danger)]" : s.severity === "med" ? "bg-[color:var(--warn)]" : "bg-[color:var(--acid)]"}`} />
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      </TiltCard>

      {r.atsIssues.length > 0 && (
        <TiltCard>
          <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--warn)]">
            <AlertTriangle className="h-3 w-3" /> ATS readability
          </h3>
          <ul className="mt-4 space-y-2">
            {r.atsIssues.map((i, k) => (
              <li key={k} className="text-sm text-muted-foreground">
                <span className={`mr-2 font-mono text-[10px] uppercase ${i.level === "warn" ? "text-[color:var(--warn)]" : "text-muted-foreground"}`}>[{i.level}]</span>
                {i.message}
              </li>
            ))}
          </ul>
        </TiltCard>
      )}
    </motion.div>
  );
}