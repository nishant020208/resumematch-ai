import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { TiltCard } from "@/components/tilt-card";
import { FileDrop } from "@/components/file-drop";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/resumes")({
  head: () => ({ meta: [{ title: "Saved resumes — ResumeMatch AI" }] }),
  component: Resumes,
});

function Resumes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const list = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await supabase.from("resumes").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const save = async () => {
    if (!user || !name.trim() || !content.trim()) return;
    const { error } = await supabase.from("resumes").insert({ user_id: user.id, name, content });
    if (error) return toast.error(error.message);
    setName(""); setContent(""); toast.success("Saved.");
    qc.invalidateQueries({ queryKey: ["resumes"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete this resume version?")) return;
    await supabase.from("resumes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["resumes"] });
  };
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-mono text-2xl font-bold sm:text-3xl">/ resumes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Store 2–3 named versions (e.g. Backend-focused, Frontend-focused) and reuse them across scans.</p>

        <TiltCard className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="version name" className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm" />
            <FileDrop label=".pdf .docx .txt" onText={setContent} />
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="resume content…" className="mt-3 h-48 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs" />
          <button onClick={save} disabled={!name.trim() || !content.trim()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-4 py-2 font-mono text-xs font-semibold text-[color:var(--acid-foreground)] disabled:opacity-50"><Plus className="h-3 w-3" /> add version</button>
        </TiltCard>

        <div className="mt-6 grid gap-3">
          {list.data?.length === 0 && <p className="text-sm text-muted-foreground">No saved resumes yet.</p>}
          {list.data?.map(r => (
            <TiltCard key={r.id} className="!p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm">{r.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{r.content.length} chars · saved {format(new Date(r.created_at), "MMM d")}</div>
                </div>
                <button onClick={() => del(r.id)} className="p-2 text-muted-foreground hover:text-[color:var(--danger)]"><Trash2 className="h-4 w-4" /></button>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </PageShell>
  );
}