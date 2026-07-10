import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { ScoreRing } from "@/components/score-ring";
import { KeywordChips } from "@/components/keyword-chips";
import { ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

  const exportPdf = async () => {
    if (!q.data) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const s = q.data;
    let y = 48;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text("ResumeMatch AI — Scan Report", 48, y); y += 26;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Score: ${Math.round(Number(s.match_score))}/100   ·   ${format(new Date(s.created_at), "PPpp")}`, 48, y); y += 24;
    if (s.resume_name) { doc.text(`Resume: ${s.resume_name}`, 48, y); y += 18; }
    doc.setFont("helvetica", "bold"); doc.text("Matched keywords", 48, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.text(((s.matched_keywords as any[]) ?? []).map((m: any) => m.keyword).join(", ") || "—", 48, y, { maxWidth: 520 }); y += 40;
    doc.setFont("helvetica", "bold"); doc.text("Missing keywords", 48, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.text(((s.missing_keywords as any[]) ?? []).map((m: any) => m.keyword).join(", ") || "—", 48, y, { maxWidth: 520 }); y += 40;
    doc.setFont("helvetica", "bold"); doc.text("Suggestions", 48, y); y += 14;
    doc.setFont("helvetica", "normal");
    for (const g of ((s.suggestions as any[]) ?? [])) { const lines = doc.splitTextToSize("• " + g.text, 520); doc.text(lines, 48, y); y += lines.length * 12 + 4; }
    doc.save(`resumematch-${id.slice(0, 8)}.pdf`);
    toast.success("Report exported.");
  };

  if (q.isLoading) return <PageShell><div className="mx-auto max-w-6xl p-10 text-sm text-muted-foreground">loading…</div></PageShell>;
  if (!q.data) return null;
  const s = q.data;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/history" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> back</Link>
          <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs hover:text-foreground"><Download className="h-3 w-3" /> export pdf</button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <TiltCard className="grid place-items-center min-w-[260px]"><ScoreRing score={Math.round(Number(s.match_score))} /></TiltCard>
          <TiltCard>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">meta</h3>
            <dl className="mt-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">scanned</dt><dd>{format(new Date(s.created_at), "PPpp")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">resume</dt><dd>{s.resume_name ?? "—"}</dd></div>
            </dl>
          </TiltCard>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <TiltCard><h3 className="font-mono text-xs uppercase text-[color:var(--success)]">matched</h3><div className="mt-3"><KeywordChips items={(s.matched_keywords as any) ?? []} variant="matched" /></div></TiltCard>
          <TiltCard><h3 className="font-mono text-xs uppercase text-[color:var(--danger)]">missing</h3><div className="mt-3"><KeywordChips items={(s.missing_keywords as any) ?? []} variant="missing" /></div></TiltCard>
        </div>
        <TiltCard className="mt-6">
          <h3 className="font-mono text-xs uppercase text-muted-foreground">suggestions</h3>
          <ul className="mt-3 space-y-2">{((s.suggestions as any[]) ?? []).map((g: any, i: number) => (<li key={i} className="text-sm">• {g.text}</li>))}</ul>
        </TiltCard>
        <TiltCard className="mt-6">
          <h3 className="font-mono text-xs uppercase text-muted-foreground">job description</h3>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">{s.jd_text}</pre>
        </TiltCard>
      </div>
    </PageShell>
  );
}