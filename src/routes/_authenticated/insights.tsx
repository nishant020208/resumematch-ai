import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Skill insights — ResumeMatch AI" }] }),
  component: Insights,
});

function Insights() {
  const scans = useQuery({
    queryKey: ["scans", "insights"],
    queryFn: async () => (await supabase.from("scans").select("missing_keywords,matched_keywords").limit(200)).data ?? [],
  });

  const missTally = new Map<string, number>();
  const matchTally = new Map<string, number>();
  for (const s of scans.data ?? []) {
    for (const k of (s.missing_keywords as any[]) ?? []) missTally.set(k.keyword, (missTally.get(k.keyword) ?? 0) + 1);
    for (const k of (s.matched_keywords as any[]) ?? []) matchTally.set(k.keyword, (matchTally.get(k.keyword) ?? 0) + 1);
  }
  const topMissing = [...missTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([keyword, count]) => ({ keyword, count }));
  const topMatched = [...matchTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([keyword, count]) => ({ keyword, count }));

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-mono text-2xl font-bold sm:text-3xl">/ insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">Skills you're consistently missing across all your JDs — prioritize what to learn.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TiltCard className="h-96">
            <h3 className="font-mono text-xs uppercase text-[color:var(--danger)]">most-missed skills</h3>
            <div className="mt-4 h-72">
              {topMissing.length === 0 ? <p className="text-sm text-muted-foreground">No data yet — run some scans.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMissing} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid stroke="color-mix(in oklch, currentColor 8%, transparent)" horizontal={false} />
                    <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={11} />
                    <YAxis type="category" dataKey="keyword" stroke="currentColor" opacity={0.6} fontSize={10} width={100} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="count" fill="var(--danger)" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TiltCard>
          <TiltCard className="h-96">
            <h3 className="font-mono text-xs uppercase text-[color:var(--success)]">most-matched skills</h3>
            <div className="mt-4 h-72">
              {topMatched.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMatched} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid stroke="color-mix(in oklch, currentColor 8%, transparent)" horizontal={false} />
                    <XAxis type="number" stroke="currentColor" opacity={0.5} fontSize={11} />
                    <YAxis type="category" dataKey="keyword" stroke="currentColor" opacity={0.6} fontSize={10} width={100} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="count" fill="var(--success)" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TiltCard>
        </div>
      </div>
    </PageShell>
  );
}