import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { diffWords } from "diff";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { ScoreRing } from "@/components/score-ring";
import { analyze } from "@/lib/analyze";
import { initModel } from "@/lib/embed-client";
import { GitCompare, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/resume-diff")({
  head: () => ({ meta: [{ title: "Compare resume versions — ResumeMatch AI" }] }),
  component: ResumeDiff,
});

function ResumeDiff() {
  const resumes = useQuery({
    queryKey: ["resumes", "diff"],
    queryFn: async () =>
      (await supabase.from("resumes").select("id,name,content,created_at").order("created_at", { ascending: false })).data ?? [],
  });

  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [jd, setJd] = useState("");
  const [scores, setScores] = useState<{ left: number; right: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { initModel().catch(() => {}); }, []);
  useEffect(() => {
    const list = resumes.data ?? [];
    if (list.length >= 2 && !leftId && !rightId) {
      setLeftId(list[1].id);
      setRightId(list[0].id);
    }
  }, [resumes.data, leftId, rightId]);

  const left = resumes.data?.find(r => r.id === leftId);
  const right = resumes.data?.find(r => r.id === rightId);

  const parts = useMemo(() => {
    if (!left || !right) return [];
    return diffWords(left.content, right.content);
  }, [left, right]);

  const scoreBoth = async () => {
    if (!left || !right || !jd.trim()) { toast.error("Pick two versions and paste a JD."); return; }
    setBusy(true); setScores(null);
    try {
      const [l, r] = await Promise.all([analyze(left.content, jd), analyze(right.content, jd)]);
      setScores({ left: l.score, right: r.score });
    } catch (e: any) { toast.error(e?.message ?? "Scoring failed"); }
    finally { setBusy(false); }
  };

  if (resumes.isLoading) return <PageShell><div className="mx-auto max-w-md p-10 text-sm text-muted-foreground">loading…</div></PageShell>;

  if (!resumes.data || resumes.data.length < 2) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <GitCompare className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 font-mono text-xl">need 2+ saved resumes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Save at least two named versions of your resume, then come back to diff them.</p>
          <Link to="/resumes" className="mt-6 inline-block rounded-md bg-[color:var(--acid)] px-4 py-2 font-mono text-xs font-semibold text-[color:var(--acid-foreground)]">go to resumes →</Link>
        </div>
      </PageShell>
    );
  }

  const delta = scores ? scores.right - scores.left : 0;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold sm:text-3xl">/ resume diff</h1>
            <p className="mt-1 text-sm text-muted-foreground">Compare two saved versions. Optionally score both against a JD to see if your edit helped.</p>
          </div>
          <Link to="/resumes" className="font-mono text-xs text-muted-foreground hover:text-foreground">← resumes</Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="surface-card p-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">base version</label>
            <select value={leftId} onChange={e => { setLeftId(e.target.value); setScores(null); }}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs">
              <option value="">— pick one —</option>
              {resumes.data.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="surface-card p-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">compared version</label>
            <select value={rightId} onChange={e => { setRightId(e.target.value); setScores(null); }}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs">
              <option value="">— pick one —</option>
              {resumes.data.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <TiltCard className="mt-6">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">optional · job description</label>
          <textarea value={jd} onChange={e => { setJd(e.target.value); setScores(null); }}
            placeholder="Paste a JD to score both versions against it…"
            className="mt-2 h-32 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs" />
          <button onClick={scoreBoth} disabled={busy || !jd.trim() || !left || !right || leftId === rightId}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-4 py-2 font-mono text-xs font-semibold text-[color:var(--acid-foreground)] disabled:opacity-50">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {busy ? "scoring both…" : "score both vs JD"}
          </button>
        </TiltCard>

        {scores && left && right && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <TiltCard className="grid place-items-center">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">{left.name}</div>
              <ScoreRing score={scores.left} size={160} />
            </TiltCard>
            <TiltCard className="grid place-items-center">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">delta</div>
              <div className={`mt-4 font-mono text-6xl font-bold tabular-nums ${delta > 0 ? "text-[color:var(--success)]" : delta < 0 ? "text-[color:var(--danger)]" : "text-muted-foreground"}`}>
                {delta > 0 ? "+" : ""}{delta}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">{delta > 0 ? "edit improved match" : delta < 0 ? "edit hurt match" : "no change"}</div>
            </TiltCard>
            <TiltCard className="grid place-items-center">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">{right.name}</div>
              <ScoreRing score={scores.right} size={160} />
            </TiltCard>
          </div>
        )}

        <TiltCard className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>diff</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[color:var(--success)]" /> added</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[color:var(--danger)]" /> removed</span>
          </div>
          {left && right && leftId !== rightId ? (
            <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border/60 bg-surface-2/40 p-4 font-mono text-xs leading-relaxed">
              {parts.map((p, i) => (
                <span
                  key={i}
                  style={{
                    background: p.added
                      ? "color-mix(in oklch, var(--success) 22%, transparent)"
                      : p.removed
                      ? "color-mix(in oklch, var(--danger) 22%, transparent)"
                      : "transparent",
                    color: p.added
                      ? "var(--success)"
                      : p.removed
                      ? "var(--danger)"
                      : "inherit",
                    textDecoration: p.removed ? "line-through" : "none",
                  }}
                >
                  {p.value}
                </span>
              ))}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Pick two different versions above to see the diff.</p>
          )}
        </TiltCard>
      </div>
    </PageShell>
  );
}