import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { ScoreRing } from "@/components/score-ring";
import { KeywordChips } from "@/components/keyword-chips";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({ meta: [{ title: "Compare scans — ResumeMatch AI" }] }),
  component: Compare,
});

function Compare() {
  const scans = useQuery({
    queryKey: ["scans", "compare"],
    queryFn: async () => (await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id]);
  const chosen = (scans.data ?? []).filter(s => picked.includes(s.id));

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-mono text-2xl font-bold sm:text-3xl">/ compare</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick 2–3 past scans to compare side by side.</p>

        <div className="mt-6 grid gap-2 max-h-64 overflow-auto surface-card p-3">
          {scans.data?.map(s => (
            <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-2">
              <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
              <span className="font-mono text-lg tabular-nums w-10">{Math.round(Number(s.match_score))}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{s.resume_name ?? "unsaved"} · {s.jd_text.slice(0, 90)}…</span>
              <span className="hidden md:inline font-mono text-[10px] text-muted-foreground">{format(new Date(s.created_at), "MMM d")}</span>
            </label>
          ))}
          {scans.data?.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Run some scans first.</p>}
        </div>

        {chosen.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chosen.map(s => (
              <TiltCard key={s.id}>
                <div className="flex items-center gap-4">
                  <ScoreRing score={Math.round(Number(s.match_score))} size={140} />
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-muted-foreground">{s.resume_name ?? "unsaved"}</div>
                    <div className="mt-1 line-clamp-3 text-xs">{s.jd_text.slice(0, 160)}…</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div><div className="font-mono text-[10px] uppercase text-[color:var(--success)]">matched ({((s.matched_keywords as any) ?? []).length})</div><div className="mt-2"><KeywordChips items={((s.matched_keywords as any) ?? []).slice(0, 8)} variant="matched" /></div></div>
                  <div><div className="font-mono text-[10px] uppercase text-[color:var(--danger)]">missing ({((s.missing_keywords as any) ?? []).length})</div><div className="mt-2"><KeywordChips items={((s.missing_keywords as any) ?? []).slice(0, 8)} variant="missing" /></div></div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}