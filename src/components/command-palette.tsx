import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Search, Zap, LayoutDashboard, History, Layers, GitCompare, Sparkles, Sun, Moon, LogOut, LogIn, Package, ArrowRight } from "lucide-react";

type Cmd = { id: string; label: string; shortcut?: string[]; icon: any; run: () => void; keywords?: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen(o => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
      // Compare mode: Cmd/Ctrl + Shift + C
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c" && user) {
        e.preventDefault(); setOpen(false); router.navigate({ to: "/compare" } as any);
      }
      // Settings / theme toggle: Cmd/Ctrl + ,
      else if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault(); toggle();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, user, router, toggle]);

  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 40); } }, [open]);

  const nav = (to: string) => () => { setOpen(false); router.navigate({ to } as any); };
  const cmds = useMemo<Cmd[]>(() => {
    const base: Cmd[] = [
      { id: "scan", label: "New scan", icon: Zap, run: nav("/scan"), keywords: "analyze match" },
      { id: "home", label: "Home", icon: ArrowRight, run: nav("/"), keywords: "landing" },
    ];
    if (user) base.push(
      { id: "dash", label: "Dashboard", icon: LayoutDashboard, run: nav("/dashboard") },
      { id: "hist", label: "History", icon: History, run: nav("/history") },
      { id: "res", label: "Resumes", icon: Package, run: nav("/resumes") },
      { id: "comp", label: "Compare scans", icon: GitCompare, run: nav("/compare"), shortcut: ["⌘", "⇧", "C"], keywords: "compare mode" },
      { id: "diff", label: "Compare resume versions", icon: Layers, run: nav("/resume-diff") },
      { id: "batch", label: "Batch — one resume vs many JDs", icon: Layers, run: nav("/batch") },
      { id: "ins", label: "Skill insights", icon: Sparkles, run: nav("/insights") },
    );
    base.push(
      { id: "theme", label: `Settings — toggle theme (currently ${theme})`, icon: theme === "dark" ? Sun : Moon, run: () => { toggle(); setOpen(false); }, shortcut: ["⌘", ","], keywords: "settings dark light mode appearance preferences" },
    );
    if (user) base.push({ id: "signout", label: "Sign out", icon: LogOut, run: async () => { setOpen(false); await supabase.auth.signOut(); router.navigate({ to: "/" }); } });
    else base.push({ id: "signin", label: "Sign in", icon: LogIn, run: nav("/auth") });
    return base;
  }, [user, theme, router, toggle]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cmds;
    return cmds.filter(c => (c.label + " " + (c.keywords ?? "")).toLowerCase().includes(s));
  }, [q, cmds]);

  useEffect(() => { setIdx(0); }, [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); filtered[idx]?.run(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] grid place-items-start justify-center bg-background/70 backdrop-blur-sm p-4 pt-[15vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -6 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.9, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            role="dialog" aria-label="Command palette"
          >
            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Jump to… (↑↓ to navigate, ↵ to run)"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-block rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
            </div>
            <ul className="max-h-80 overflow-auto py-1">
              {filtered.length === 0 && <li className="px-4 py-6 text-center font-mono text-xs text-muted-foreground">no results</li>}
              {filtered.map((c, i) => (
                <li key={c.id}>
                  <button
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => c.run()}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left font-mono text-sm ${i === idx ? "bg-[color:var(--acid)]/12 text-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
                  >
                    <c.icon className={`h-4 w-4 ${i === idx ? "text-[color:var(--acid)]" : ""}`} />
                    <span className="flex-1">{c.label}</span>
                    {c.shortcut && (
                      <span className="flex items-center gap-1">
                        {c.shortcut.map((k, ki) => (
                          <kbd key={ki} className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k}</kbd>
                        ))}
                      </span>
                    )}
                    {i === idx && !c.shortcut && <ArrowRight className="h-3 w-3 text-[color:var(--acid)]" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border/60 bg-surface-2/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              <span>press <kbd className="rounded border border-border bg-background px-1">⌘K</kbd> anywhere</span>
              <span>{filtered.length} command{filtered.length === 1 ? "" : "s"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}