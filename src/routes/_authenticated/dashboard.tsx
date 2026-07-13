import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowRight, Play, History, Layers } from "lucide-react";
import { format } from "date-fns";
import { StreakBadge } from "@/components/streak-badge";
import { AchievementsGrid } from "@/components/achievements";
import { computeStreak, type AchievementCode } from "@/lib/achievements";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ResumeMatch AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const scans = useQuery({
    queryKey: ["scans", "trend"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scans").select("id,match_score,created_at,jd_title,resume_name").order("created_at", { ascending: true }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const resumesQ = useQuery({
    queryKey: ["resumes-count"],
    queryFn: async () => (await supabase.from("resumes").select("id", { count: "exact", head: true })).count ?? 0,
  });
  const achievementsQ = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("achievements").select("code");
      if (error) throw error;
      return new Set((data ?? []).map(a => a.code as AchievementCode));
    },
  });

  const chartData = (scans.data ?? []).map(s => ({ date: format(new Date(s.created_at), "MMM d"), score: Number(s.match_score) }));
  const last = scans.data?.[scans.data.length - 1];
  const avg = scans.data?.length ? Math.round(scans.data.reduce((a, s) => a + Number(s.match_score), 0) / scans.data.length) : 0;
  const streak = computeStreak((scans.data ?? []).map(s => s.created_at as string));

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-mono text-2xl font-bold sm:text-3xl">/ dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your match-score trend and quick actions.</p>
          </div>
          <Link to="/scan" className="inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-4 py-2 font-mono text-xs font-semibold text-[color:var(--acid-foreground)]">
            <Play className="h-3 w-3" /> new scan
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="total scans" value={scans.data?.length ?? 0} />
          <Stat label="avg score" value={`${avg}%`} />
          <Stat label="latest" value={last ? `${Math.round(Number(last.match_score))}%` : "—"} />
        </div>

        <div className="mt-6"><StreakBadge streak={streak} /></div>

        <TiltCard className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">achievements</h3>
          <div className="mt-4"><AchievementsGrid unlocked={achievementsQ.data ?? new Set()} /></div>
        </TiltCard>

        <TiltCard className="mt-6 h-80">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">score trend</h3>
          <div className="mt-4 h-56">
            {chartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <p>No scans yet.</p>
                <Link to="/scan" className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-[color:var(--acid)]">run your first scan <ArrowRight className="h-3 w-3" /></Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="color-mix(in oklch, currentColor 8%, transparent)" vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" opacity={0.5} fontSize={11} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--font-mono)" }} />
                  <Line type="monotone" dataKey="score" stroke="var(--acid)" strokeWidth={2} dot={{ r: 3, fill: "var(--acid)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TiltCard>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link to="/history"><TiltCard className="h-full"><History className="h-5 w-5 text-[color:var(--acid)]" /><h3 className="mt-3 font-mono text-sm">scan history →</h3><p className="mt-1 text-xs text-muted-foreground">Search and revisit past scans.</p></TiltCard></Link>
          <Link to="/resumes"><TiltCard className="h-full"><Layers className="h-5 w-5 text-[color:var(--acid)]" /><h3 className="mt-3 font-mono text-sm">resumes ({resumesQ.data ?? 0}) →</h3><p className="mt-1 text-xs text-muted-foreground">Manage named resume versions.</p></TiltCard></Link>
          <Link to="/insights"><TiltCard className="h-full"><ArrowRight className="h-5 w-5 text-[color:var(--acid)]" /><h3 className="mt-3 font-mono text-sm">skill insights →</h3><p className="mt-1 text-xs text-muted-foreground">What you're consistently missing.</p></TiltCard></Link>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <TiltCard>
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums">{value}</div>
    </TiltCard>
  );
}