import { motion } from "framer-motion";
import { Nav } from "./nav";
import { PrivacyBadge } from "./privacy-badge";
import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <motion.main
        key={typeof window !== "undefined" ? window.location.pathname : "s"}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <footer className="mt-16 border-t border-border/60 bg-background/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row">
          <p className="font-mono text-xs text-muted-foreground">resumematch.ai · built for engineers, run on your device</p>
          <PrivacyBadge />
        </div>
      </footer>
    </div>
  );
}