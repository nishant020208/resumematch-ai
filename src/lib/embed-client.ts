// Main-thread wrapper for the embedding worker
let worker: Worker | null = null;
let pending = new Map<string, (vecs: number[][]) => void>();
const listeners = new Set<(p: { status: string; progress?: number; file?: string }) => void>();
let ready = false;
let readyResolvers: Array<() => void> = [];

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("../workers/embed.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === "progress") {
      listeners.forEach(l => l({ status: msg.status, progress: msg.progress, file: msg.file }));
    } else if (msg.type === "ready") {
      ready = true;
      readyResolvers.forEach(r => r());
      readyResolvers = [];
      listeners.forEach(l => l({ status: "ready" }));
    } else if (msg.type === "embed:done") {
      const cb = pending.get(msg.id);
      if (cb) { pending.delete(msg.id); cb(msg.vectors); }
    } else if (msg.type === "error") {
      console.error("[embed-worker]", msg.message);
    }
  };
  return worker;
}

export function onProgress(cb: (p: { status: string; progress?: number; file?: string }) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export async function initModel() {
  const w = ensureWorker();
  if (ready) return;
  await new Promise<void>((resolve) => {
    readyResolvers.push(resolve);
    w.postMessage({ type: "init" });
  });
}

export async function embed(texts: string[]): Promise<number[][]> {
  const w = ensureWorker();
  await initModel();
  const id = crypto.randomUUID();
  return new Promise((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ type: "embed", id, texts });
  });
}

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}