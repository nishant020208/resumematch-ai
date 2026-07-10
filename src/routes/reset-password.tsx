import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — ResumeMatch AI" }] }),
  component: Reset,
});

function Reset() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      nav({ to: "/dashboard" });
    } catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
  };
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="surface-card p-8">
          <h1 className="font-mono text-lg">set a new password</h1>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <input type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="new password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm" />
            <button disabled={busy} className="w-full rounded-md bg-[color:var(--acid)] px-4 py-2.5 font-mono text-sm font-semibold text-[color:var(--acid-foreground)]">
              {busy ? "saving…" : "update password"}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}