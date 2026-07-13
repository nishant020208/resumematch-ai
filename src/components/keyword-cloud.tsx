import { useMemo } from "react";
import { toast } from "sonner";

type Item = { keyword: string; count: number };

/** Interactive word cloud from JD keywords. Green = matched, red = missing.
 *  Clicking a matched word scrolls to & highlights its first occurrence in the resume textarea. */
export function KeywordCloud({
  matched, missing, resume, resumeElRef,
}: {
  matched: Item[]; missing: Item[]; resume: string;
  resumeElRef?: { current: HTMLTextAreaElement | null };
}) {
  const items = useMemo(() => {
    const all = [
      ...matched.map(m => ({ ...m, matched: true })),
      ...missing.map(m => ({ ...m, matched: false })),
    ];
    const max = Math.max(1, ...all.map(a => a.count));
    const min = Math.min(...all.map(a => a.count));
    return all
      .sort(() => Math.random() - 0.5)
      .map(a => {
        const t = (a.count - min) / Math.max(1, max - min);
        return { ...a, size: 12 + Math.round(t * 22) }; // 12–34px
      });
  }, [matched, missing]);

  const jumpTo = (kw: string, isMatched: boolean) => {
    if (!isMatched) { toast.info(`"${kw}" isn't in your resume yet.`); return; }
    const ta = resumeElRef?.current;
    if (!ta) { toast.info(`"${kw}" is in your resume.`); return; }
    const lower = resume.toLowerCase();
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx < 0) { toast.info(`"${kw}" is matched semantically, not literally.`); return; }
    ta.focus();
    ta.setSelectionRange(idx, idx + kw.length);
    // rough scroll: proportional to character offset
    const ratio = idx / Math.max(1, resume.length);
    ta.scrollTop = ratio * ta.scrollHeight - ta.clientHeight / 3;
    ta.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (items.length === 0) return <p className="text-sm text-muted-foreground">Run a scan to see the JD keyword cloud.</p>;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-border/60 bg-surface-2/40 p-4 leading-tight">
      {items.map((it, i) => (
        <button
          key={it.keyword + i}
          onClick={() => jumpTo(it.keyword, it.matched)}
          className="font-mono transition-transform hover:scale-110 hover:underline decoration-dotted underline-offset-4"
          style={{
            fontSize: it.size,
            color: it.matched ? "var(--success)" : "color-mix(in oklch, var(--danger) 70%, var(--muted-foreground))",
            opacity: it.matched ? 1 : 0.75,
          }}
          title={`${it.keyword} · ${it.count}× in JD${it.matched ? " · in resume" : " · missing"}`}
        >
          {it.keyword}
        </button>
      ))}
    </div>
  );
}