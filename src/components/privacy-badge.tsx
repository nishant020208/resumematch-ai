import { Lock } from "lucide-react";

export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--acid)]/40 bg-[color:var(--acid)]/10 px-3 py-1 text-xs font-mono text-[color:var(--acid)]">
      <Lock className="h-3 w-3" />
      {compact ? "on-device" : "100% on-device · your resume never leaves the browser"}
    </div>
  );
}