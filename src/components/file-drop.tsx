import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { extractText } from "@/lib/text-extract";
import { toast } from "sonner";

export function FileDrop({ onText, label }: { onText: (t: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const handle = async (file: File) => {
    setBusy(true);
    try {
      const t = await extractText(file);
      onText(t.trim());
      toast.success(`Loaded ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to read file");
    } finally { setBusy(false); }
  };
  return (
    <>
      <input
        ref={ref} type="file" accept=".txt,.pdf,.docx,text/plain"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
      <button
        type="button" onClick={() => ref.current?.click()} disabled={busy}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-mono text-muted-foreground transition-all hover:text-foreground hover:border-[color:var(--acid)]/50 active:scale-95 disabled:opacity-50"
      >
        <Upload className="h-3 w-3" />
        {busy ? "reading…" : label}
      </button>
    </>
  );
}