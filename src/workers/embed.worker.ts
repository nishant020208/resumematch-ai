/// <reference lib="webworker" />
// Runs Transformers.js MiniLM entirely off the main thread.
import { pipeline, env } from "@huggingface/transformers";

// Cache models in IndexedDB via HTTP cache, allow remote CDN (default)
env.allowLocalModels = false;
env.useBrowserCache = true;

type Msg =
  | { type: "init" }
  | { type: "embed"; id: string; texts: string[] };

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (p: any) => {
        (self as any).postMessage({ type: "progress", ...p });
      },
    });
  }
  return extractorPromise;
}

self.onmessage = async (e: MessageEvent<Msg>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      await getExtractor();
      (self as any).postMessage({ type: "ready" });
      return;
    }
    if (msg.type === "embed") {
      const extractor = await getExtractor();
      const vectors: number[][] = [];
      for (const text of msg.texts) {
        const out = await extractor(text || " ", { pooling: "mean", normalize: true });
        vectors.push(Array.from(out.data as Float32Array));
      }
      (self as any).postMessage({ type: "embed:done", id: msg.id, vectors });
    }
  } catch (err: any) {
    (self as any).postMessage({ type: "error", message: err?.message ?? String(err) });
  }
};

export {};