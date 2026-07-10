import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Scan history — ResumeMatch AI" }] }),
  component: History,
});

function History() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const scans = useQuery({
    queryKey: ["scans", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scans").select("id,match_score,created_at,jd_text,resume_name,matched_keywords,missing_keywords").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = (scans.data ?? []).filter(s =>
    !q || s.jd_text.toLowerCase().includes(q.toLowerCase()) || (s.resume_name ?? "").toLowerCase().includes(q.toLowerCase()));

  const del = async (id: string) => {
    if (!confirm("Delete this scan?")) return;
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["scans"] });
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-mono text-2xl font-bold sm:text-3xl">/ history</h1>
        <div className="mt-6 flex items-center gap-2 rounded-md border border-input bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="search JD or resume name…" className="w-full bg-transparent py-2 font-mono text-sm outline-none" />
        </div>
        {scans.isLoading && <p className="mt-8 text-sm text-muted-foreground">loading…</p>}
        {scans.data && scans.data.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">No scans yet.</p>
            <Link to="/scan" className="mt-4 inline-block rounded-md bg-[color:var(--acid)] px-4 py-2 font-mono text-xs font-semibold text-[color:var(--acid-foreground)]">run your first scan</Link>
          </div>
        )}
        <div className="mt-6 grid gap-3">
          {filtered.map(s => (
            <TiltCard key={s.id} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <Link to="/history/$id" params={{ id: s.id }} className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-2xl font-bold tabular-nums ${Number(s.match_score) >= 75 ? "text-[color:var(--success)]" : Number(s.match_score) >= 55 ? "text-[color:var(--acid)]" : "text-[color:var(--warn)]"}`}>{Math.round(Number(s.match_score))}</span>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-muted-foreground">{s.resume_name ?? "unsaved resume"} · {format(new Date(s.created_at), "MMM d, HH:mm")}</div>
                      <div className="truncate text-sm">{s.jd_text.slice(0, 140)}…</div>
                    </div>
                  </div>
                </Link>
                <button onClick={() => del(s.id)} className="p-2 text-muted-foreground hover:text-[color:var(--danger)]" aria-label="delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </PageShell>
  );
}