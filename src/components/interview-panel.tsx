import { pickInterviewQuestions } from "@/lib/interview-bank";
import { HelpCircle } from "lucide-react";

export function InterviewPanel({ missing }: { missing: { keyword: string; count: number }[] }) {
  const qs = pickInterviewQuestions(missing);
  if (!qs.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2">
        <HelpCircle className="h-3 w-3 text-[color:var(--acid)]" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">practice questions based on your gaps</h3>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Curated question bank — not AI-generated. Processed locally.</p>
      <ul className="mt-4 space-y-2">
        {qs.map((q, i) => (
          <li key={i} className="rounded-md border border-border/60 bg-surface-2/40 p-3 text-sm">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--acid)]">{q.keyword}</div>
            <div>{q.question}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}