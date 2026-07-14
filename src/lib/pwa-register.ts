import { toast } from "sonner";

const SW_PATH = "/sw.js";

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(SW_PATH)) await r.unregister();
    }
  } catch { /* noop */ }
}

export async function registerPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (shouldSkip()) { await unregisterMatching(); return; }

  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    const notify = () => {
      if (!localStorage.getItem("rm_pwa_notified")) {
        localStorage.setItem("rm_pwa_notified", "1");
        toast.success("Resonate is ready to use offline.");
      }
    };
    if (reg.active) notify();
    else reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      sw?.addEventListener("statechange", () => { if (sw.state === "activated") notify(); });
    });
  } catch (e) {
    console.warn("[pwa] register failed", e);
  }
}