import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page-shell";
import { Ambient } from "@/components/ambient";
import { toast } from "sonner";
import { Terminal } from "lucide-react";
import { MagneticButton } from "@/components/magnetic-button";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ResumeMatch AI" }, { name: "description", content: "Sign in to save scans, resumes, and compare over time." }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
        nav({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
        nav({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("If that email exists, a reset link is on its way.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <PageShell>
      <div className="relative min-h-[calc(100vh-140px)] overflow-hidden">
        <Ambient />
        <div className="relative mx-auto flex max-w-md flex-col items-center justify-center px-4 py-16 sm:py-24">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full surface-card p-8">
            <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Terminal className="h-3 w-3 text-[color:var(--acid)]" />
              {mode === "signin" ? "sign in" : mode === "signup" ? "create account" : "reset password"}
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs text-muted-foreground">email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-[color:var(--acid)] focus:ring-1 focus:ring-[color:var(--acid)]" />
              </div>
              {mode !== "reset" && (
                <div>
                  <label className="mb-1 block font-mono text-xs text-muted-foreground">password</label>
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-[color:var(--acid)] focus:ring-1 focus:ring-[color:var(--acid)]" />
                </div>
              )}
              <MagneticButton disabled={busy} className="w-full rounded-md bg-[color:var(--acid)] px-4 py-2.5 font-mono text-sm font-semibold text-[color:var(--acid-foreground)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">
                {busy ? "working…" : mode === "signin" ? "sign in" : mode === "signup" ? "create account" : "send reset link"}
              </MagneticButton>
            </form>
            <div className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-xs text-muted-foreground">
              {mode !== "signin" && <button onClick={() => setMode("signin")} className="hover:text-[color:var(--acid)]">← sign in</button>}
              {mode === "signin" && <button onClick={() => setMode("signup")} className="hover:text-[color:var(--acid)]">create account</button>}
              {mode === "signin" && <button onClick={() => setMode("reset")} className="hover:text-[color:var(--acid)]">forgot password?</button>}
            </div>
          </motion.div>
          <Link to="/scan" className="mt-6 font-mono text-xs text-muted-foreground hover:text-foreground">or continue as guest →</Link>
        </div>
      </div>
    </PageShell>
  );
}