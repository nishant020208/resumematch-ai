import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, ShieldCheck, Zap, Terminal, Search, LineChart } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Ambient } from "@/components/ambient";
import { PrivacyBadge } from "@/components/privacy-badge";
import { TiltCard } from "@/components/tilt-card";
import { HeroMesh } from "@/components/hero-mesh";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <Ambient />
        <HeroMesh />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <PrivacyBadge />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            Match your resume to any job.{" "}
            <span className="text-[color:var(--acid)]">Locally.</span>{" "}
            <span className="text-muted-foreground">In your browser.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            A real embedding model — MiniLM — runs inside your tab. Paste a JD, get a match score,
            missing keywords, and rewrite hints. Nothing is uploaded. Ever.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/scan"
              className="group inline-flex items-center gap-2 rounded-md bg-[color:var(--acid)] px-5 py-3 font-mono text-sm font-semibold text-[color:var(--acid-foreground)] transition-all hover:-translate-y-0.5 acid-glow active:scale-95"
            >
              run a scan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md hair-border bg-transparent px-5 py-3 font-mono text-sm text-foreground transition-all hover:bg-surface-2 active:scale-95"
            >
              save your history
            </Link>
          </motion.div>

          <div className="mt-6 flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--acid)] animate-pulse" />
            one free scan · no signup required
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <TiltCard className="h-full">
                <f.icon className="h-6 w-6 text-[color:var(--acid)]" />
                <h3 className="mt-4 font-mono text-sm uppercase tracking-wider">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal className="surface-card overflow-hidden block">
          <div className="border-b border-border/60 bg-surface-2 px-5 py-2 font-mono text-xs text-muted-foreground">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[color:var(--danger)]"></span>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[color:var(--warn)]"></span>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[color:var(--success)]"></span>
            ~/resumematch $ analyze
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-xs sm:text-sm leading-relaxed">
            <code>
{`> loading Xenova/all-MiniLM-L6-v2 in WebWorker...          [OK]
> embedding resume  (784 tokens)                            [OK]
> embedding job description  (612 tokens)                   [OK]
> cosine similarity                                         → 0.741
> matched: React, TypeScript, PostgreSQL, REST API, Docker  (14)
> missing: Kubernetes, gRPC, Terraform                      (3)
> suggestion: add "gRPC" — mentioned 3× in JD
> `}<span className="text-[color:var(--acid)]">score: 74/100</span>
            </code>
          </pre>
        </Reveal>
      </section>
    </PageShell>
  );
}

const FEATURES = [
  { icon: Cpu, title: "on-device AI", body: "The same sentence-embedding model that powers semantic search — running inside your tab in a Web Worker." },
  { icon: ShieldCheck, title: "zero exfiltration", body: "Your resume and any JD you paste never leave the browser. No API calls, no logs, no ad tracking." },
  { icon: Zap, title: "sub-second scans", body: "First load caches the ~30 MB model. Every scan after that is instant, offline-capable, and free." },
  { icon: Search, title: "gap analysis", body: "Curated skill bank + frequency extraction highlights exactly which JD terms your resume is missing." },
  { icon: LineChart, title: "trend tracking", body: "Save named resume versions, compare scans side-by-side, and see your match score climb over time." },
  { icon: Terminal, title: "built for engineers", body: "Keyboard-first, monospace UI, distraction-free — like the tools you already live in." },
];
