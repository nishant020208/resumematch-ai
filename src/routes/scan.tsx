import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { fetchJdFromUrl } from "@/lib/jd-fetch";
import { SkillRadar } from "@/components/skill-radar";
import { ResumeHeatmap } from "@/components/resume-heatmap";
import { InterviewPanel } from "@/components/interview-panel";
import { ShareCard } from "@/components/share-card";
import { LineOptimizer } from "@/components/line-optimizer";
import { KeywordCloud } from "@/components/keyword-cloud";
import { AtsFixer } from "@/components/ats-fixer";
import { MagneticButton } from "@/components/magnetic-button";
import { Reveal } from "@/components/reveal";
import { evaluateUnlocks, computeStreak } from "@/lib/achievements";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, Save, Sparkles, AlertTriangle, FileText, Link2, Loader2, Focus, X } from "lucide-react";
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
  const [jdUrl, setJdUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const resumeRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!focusMode) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") setFocusMode(false); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [focusMode]);

  useEffect(() => onProgress(setProgress), []);
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
      if (user) void unlockAchievements(user.id, r.score, resumes.length);
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

  const fetchUrl = async () => {
    if (!jdUrl.trim()) return;
    setFetching(true);
    try {
      const text = await fetchJdFromUrl(jdUrl);
      setJd(text);
      toast.success("JD imported from URL.");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't fetch that URL");
    } finally { setFetching(false); }
  };

  if (focusMode) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-background p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">focus mode · esc to exit</div>
          <button onClick={() => setFocusMode(false)} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs hover:text-foreground">
            <X className="h-3 w-3" /> exit
          </button>
        </div>
        <div className="grid flex-1 gap-3 md:grid-cols-2 min-h-0">
          <textarea value={resume} onChange={e => setResume(e.target.value)}
            placeholder="Resume…"
            className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm leading-relaxed outline-none focus:border-[color:var(--acid)]/50" />
          <textarea value={jd} onChange={e => setJd(e.target.value)}
            placeholder="Job description…"
            className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm leading-relaxed outline-none focus:border-[color:var(--acid)]/50" />
        </div>
        <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2">
          <MagneticButton onClick={run} disabled={running}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[color:var(--acid)] px-6 py-3 font-mono text-sm font-semibold text-[color:var(--acid-foreground)] shadow-xl acid-glow disabled:opacity-60">
            <Play className="h-4 w-4" /> {running ? "analyzing…" : "analyze"}
          </MagneticButton>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <ErrorBoundary>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate font-mono text-2xl font-bold tracking-tight sm:text-3xl">/ scan</h1>
              <p className="mt-1 text-sm text-muted-foreground">Paste resume + JD. Everything runs in your browser.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFocusMode(true)} className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">
                <Focus className="h-3 w-3" /> focus mode
              </button>
              <PrivacyBadge compact />
            </div>
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
                ref={resumeRef}
                className="h-72 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--acid)]/50" />
              <div className="mt-2 font-mono text-[10px] text-muted-foreground">{resume.length} chars · {resume.trim().split(/\s+/).filter(Boolean).length} words</div>
              {resume.trim().length > 50 && (
                <div className="mt-3"><AtsFixer resume={resume} onApply={setResume} /></div>
              )}
            </div>

            <div className="surface-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-[color:var(--acid)]" /> job description
                </div>
                <FileDrop label=".pdf .docx .txt" onText={setJd} />
              </div>
              <div className="mb-3 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url" value={jdUrl} onChange={e => setJdUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); fetchUrl(); } }}
                    placeholder="or paste a job posting URL…"
                    className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-1.5 font-mono text-xs"
                  />
                </div>
                <button
                  type="button" onClick={fetchUrl} disabled={fetching || !jdUrl.trim()}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs hover:text-foreground disabled:opacity-50"
                >
                  {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : "fetch"}
                </button>
              </div>
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">Many job sites block cross-origin fetches — paste manually as fallback.</p>
              <textarea value={jd} onChange={e => setJd(e.target.value)}
                placeholder="Paste the job description…"
                className="h-[calc(18rem+37px)] w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--acid)]/50" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <MagneticButton onClick={run} disabled={running}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-5 py-2.5 font-mono text-sm font-semibold text-[color:var(--acid-foreground)] transition-all hover:-translate-y-0.5 acid-glow active:scale-95 disabled:opacity-60">
              <Play className="h-4 w-4" /> {running ? "analyzing…" : "analyze"}
            </MagneticButton>
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

          {result && <Results r={result} resume={resume} resumeRef={resumeRef} />}
        </div>
      </ErrorBoundary>
    </PageShell>
  );
}

async function unlockAchievements(userId: string, score: number, savedResumesCount: number) {
  try {
    const [{ data: scans }, { data: existing }] = await Promise.all([
      supabase.from("scans").select("created_at").eq("user_id", userId),
      supabase.from("achievements").select("code").eq("user_id", userId),
    ]);
    const total = scans?.length ?? 0;
    const streak = computeStreak((scans ?? []).map(s => s.created_at as string));
    const already = new Set((existing ?? []).map(e => e.code as string));
    const unlocks = evaluateUnlocks({ totalScans: total, score, streak, savedResumesCount }, already);
    if (unlocks.length === 0) return;
    await supabase.from("achievements").insert(unlocks.map(code => ({ user_id: userId, code })));
    for (const code of unlocks) toast.success(`🏆 Achievement unlocked: ${code.replace(/_/g, " ")}`);
  } catch { /* silent */ }
}

function Results({ r, resume, resumeRef }: { r: AnalyzeResult; resume: string; resumeRef?: React.MutableRefObject<HTMLTextAreaElement | null> }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-10 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <TiltCard className="grid place-items-center min-w-[260px]">
          <ScoreRing score={r.score} />
          <div className="mt-4"><ShareCard score={r.score} label={`${r.score}% match to this JD`} /></div>
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

      <TiltCard>
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">skill coverage radar</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">Resume vs JD demand across 5 skill categories.</p>
        <SkillRadar data={r.categoryScores} />
      </TiltCard>

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

      <Reveal>
        <TiltCard>
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">jd keyword cloud</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Green = present in your resume · red = missing. Click a matched term to jump to it.</p>
          <div className="mt-4"><KeywordCloud matched={r.matched} missing={r.missing} resume={resume} resumeElRef={resumeRef} /></div>
        </TiltCard>
      </Reveal>

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

      <TiltCard><LineOptimizer resume={resume} missing={r.missing} jdVector={r.jdVector} /></TiltCard>
      <TiltCard><ResumeHeatmap lines={r.lineScores} /></TiltCard>
      {r.missing.length > 0 && <TiltCard><InterviewPanel missing={r.missing} /></TiltCard>}

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