import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Menu, X, Terminal, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const authedLinks = [
  { to: "/scan", label: "scan" },
  { to: "/dashboard", label: "dashboard" },
  { to: "/history", label: "history" },
  { to: "/resumes", label: "resumes" },
  { to: "/compare", label: "compare" },
  { to: "/insights", label: "insights" },
] as const;

const publicLinks = [
  { to: "/scan", label: "scan" },
] as const;

export function Nav() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = user ? authedLinks : publicLinks;

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[color:var(--acid)] text-[color:var(--acid-foreground)] transition-transform group-hover:rotate-3">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="whitespace-nowrap">resumematch<span className="text-[color:var(--acid)]">.ai</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link
              key={l.to} to={l.to as any}
              className="rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-all hover:bg-surface-2 hover:text-foreground"
              activeProps={{ className: "text-foreground bg-surface-2" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:inline-flex font-mono text-xs">
              <LogOut className="h-3 w-3" /> sign out
            </Button>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex items-center rounded-md bg-[color:var(--acid)] px-3 py-1.5 font-mono text-xs font-semibold text-[color:var(--acid-foreground)] transition-transform hover:-translate-y-0.5 active:scale-95">
              sign in
            </Link>
          )}
          <button className="md:hidden p-2" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav className="flex flex-col px-4 py-3">
            {links.map(l => (
              <Link key={l.to} to={l.to as any} onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 font-mono text-sm uppercase tracking-wider text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                activeProps={{ className: "text-foreground bg-surface-2" }}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => { setOpen(false); signOut(); }} className="mt-1 rounded-md px-3 py-2 text-left font-mono text-sm text-muted-foreground hover:bg-surface-2">
                sign out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="mt-2 rounded-md bg-[color:var(--acid)] px-3 py-2 text-center font-mono text-sm font-semibold text-[color:var(--acid-foreground)]">
                sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}