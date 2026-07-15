import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { ScoreRing } from "@/components/score-ring";
import { KeywordChips } from "@/components/keyword-chips";
import { SkillRadar } from "@/components/skill-radar";
import { ShareCard } from "@/components/share-card";
import { InterviewPanel } from "@/components/interview-panel";
import { categoryScores } from "@/lib/keywords";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ExportThemePicker } from "@/components/export-theme-picker";
import { renderScanPdf, type ExportTheme } from "@/lib/export-themes";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/_authenticated/history/$id")({
  head: () => ({ meta: [{ title: "Scan — ResumeMatch AI" }] }),
  component: ScanDetail,
  notFoundComponent: () => <PageShell><div className="mx-auto max-w-md p-12 text-center"><p>Scan not found.</p><Link to="/history" className="mt-3 inline-block text-[color:var(--acid)]">← history</Link></div></PageShell>,
  errorComponent: ({ error }) => <PageShell><div className="mx-auto max-w-md p-12 text-center text-sm text-muted-foreground">{error.message}</div></PageShell>,
});

function ScanDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["scan", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });
  const catScores = useMemo(
    () => q.data ? categoryScores(q.data.resume_text, q.data.jd_text) : [],
    [q.data],
  );

  const exportPdf = async (theme: ExportTheme) => {
    if (!q.data) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    renderScanPdf(doc, q.data as any, format(new Date(q.data.created_at), "PPpp"), theme);
    doc.save(`resumematch-${id.slice(0, 8)}.pdf`);
    toast.success("Report exported.");
  };

  if (q.isLoading) return <PageShell><div className="mx-auto max-w-6xl p-10 text-sm text-muted-foreground">loading…</div></PageShell>;
  if (!q.data) return null;
  const s = q.data;
  const score = Math.round(Number(s.match_score));
  const missing = ((s.missing_keywords as any) ?? []) as { keyword: string; count: number }[];

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/history" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> back</Link>
          <ExportThemePicker score={score} onExport={exportPdf} />
        </div>
        <Reveal className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <TiltCard className="grid place-items-center min-w-[260px]">
            <ScoreRing score={score} />
            <div className="mt-4"><ShareCard score={score} label={`${score}% match to this JD`} /></div>
          </TiltCard>
          <TiltCard>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">meta</h3>
            <dl className="mt-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">scanned</dt><dd>{format(new Date(s.created_at), "PPpp")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">resume</dt><dd>{s.resume_name ?? "—"}</dd></div>
            </dl>
          </TiltCard>
        </Reveal>
        <Reveal delay={80}><TiltCard className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">skill coverage radar</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Resume vs JD demand across 5 skill categories · recomputed locally.</p>
          <SkillRadar data={catScores} />
        </TiltCard></Reveal>
        <Reveal delay={120} className="mt-6 grid gap-6 md:grid-cols-2">
          <TiltCard><h3 className="font-mono text-xs uppercase text-[color:var(--success)]">matched</h3><div className="mt-3"><KeywordChips items={(s.matched_keywords as any) ?? []} variant="matched" /></div></TiltCard>
          <TiltCard><h3 className="font-mono text-xs uppercase text-[color:var(--danger)]">missing</h3><div className="mt-3"><KeywordChips items={missing} variant="missing" /></div></TiltCard>
        </Reveal>
        <Reveal delay={160}><TiltCard className="mt-6">
          <h3 className="font-mono text-xs uppercase text-muted-foreground">suggestions</h3>
          <ul className="mt-3 space-y-2">{((s.suggestions as any[]) ?? []).map((g: any, i: number) => (<li key={i} className="text-sm">• {g.text}</li>))}</ul>
        </TiltCard></Reveal>
        {missing.length > 0 && <Reveal delay={200}><TiltCard className="mt-6"><InterviewPanel missing={missing} /></TiltCard></Reveal>}
        <Reveal delay={240}><TiltCard className="mt-6">
          <h3 className="font-mono text-xs uppercase text-muted-foreground">job description</h3>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">{s.jd_text}</pre>
        </TiltCard></Reveal>
      </div>
    </PageShell>
  );
}