import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function OnlineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return (
    <span
      title={online ? "Online" : "Offline — cached app + AI model still work"}
      className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${online ? "border-[color:var(--success)]/40 text-[color:var(--success)]" : "border-[color:var(--warn)]/40 text-[color:var(--warn)]"}`}
    >
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {online ? "online" : "offline"}
    </span>
  );
}