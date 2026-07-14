import { forwardRef, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Copy, Share2, Loader2 } from "lucide-react";

type Props = { score: number; label?: string };

const CardArt = forwardRef<HTMLDivElement, Props>(function CardArt({ score, label }, ref) {
  const color = score >= 75 ? "var(--success)" : score >= 55 ? "var(--acid)" : "var(--warn)";
  return (
    <div
      ref={ref}
      style={{
        width: 1200, height: 630,
        background: "oklch(0.13 0.008 240)",
        color: "oklch(0.94 0.005 100)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      {/* grid pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.5,
        backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      {/* accent glow */}
      <div style={{ position: "absolute", right: -140, top: -140, width: 480, height: 480, borderRadius: "50%", background: "oklch(0.86 0.22 130 / 0.25)", filter: "blur(60px)" }} />

      <div style={{ position: "relative", padding: "72px 80px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "oklch(0.86 0.22 130)", display: "grid", placeItems: "center", color: "oklch(0.14 0.02 240)", fontWeight: 800 }}>R</div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>resonate</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>on-device resume matcher</span>
        </div>

        <div>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>match score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 8 }}>
            <div style={{ fontSize: 260, fontWeight: 800, lineHeight: 1, color, textShadow: `0 0 60px ${color}` }}>{score}</div>
            <div style={{ fontSize: 60, fontWeight: 700 }}>%</div>
          </div>
          {label && <div style={{ fontSize: 26, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>{label}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 16, color: "rgba(255,255,255,0.5)" }}>
          <span>processed 100% in-browser · zero uploads</span>
          <span>resonate.app</span>
        </div>
      </div>
    </div>
  );
});

export function ShareCard({ score, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);

  const render = async () => {
    if (!ref.current) throw new Error("Card not ready");
    return toPng(ref.current, { pixelRatio: 1, cacheBust: true, width: 1200, height: 630 });
  };

  const onDownload = async () => {
    setBusy("download");
    try {
      const url = await render();
      const a = document.createElement("a");
      a.href = url; a.download = `resonate-${score}pct.png`; a.click();
      toast.success("Downloaded.");
    } catch (e: any) { toast.error(e?.message ?? "Failed to render card"); }
    finally { setBusy(null); }
  };

  const onCopy = async () => {
    setBusy("copy");
    try {
      const url = await render();
      const blob = await (await fetch(url)).blob();
      if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
        throw new Error("Clipboard image copy isn't supported in this browser — use Download.");
      }
      await navigator.clipboard.write([new (window as any).ClipboardItem({ [blob.type]: blob })]);
      toast.success("Copied to clipboard.");
    } catch (e: any) { toast.error(e?.message ?? "Failed to copy"); }
    finally { setBusy(null); }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={onDownload} disabled={!!busy} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs hover:text-foreground disabled:opacity-50">
          {busy === "download" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} download card
        </button>
        <button onClick={onCopy} disabled={!!busy} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs hover:text-foreground disabled:opacity-50">
          {busy === "copy" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />} copy image
        </button>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><Share2 className="h-3 w-3" /> post to LinkedIn</span>
      </div>
      {/* Off-screen render target */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <CardArt ref={ref} score={score} label={label} />
      </div>
    </>
  );
}