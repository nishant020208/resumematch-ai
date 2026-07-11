// Attempts to fetch a job posting URL client-side and extract visible text.
// Many job sites block cross-origin fetches — always fall back to manual paste.

export async function fetchJdFromUrl(url: string): Promise<string> {
  let target: URL;
  try {
    target = new URL(url.trim());
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (!/^https?:$/.test(target.protocol)) {
    throw new Error("Only http(s) URLs are supported.");
  }

  let html: string;
  try {
    const res = await fetch(target.toString(), {
      method: "GET",
      mode: "cors",
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    html = await res.text();
  } catch (e: any) {
    // Distinguish CORS/network from server errors as best we can.
    throw new Error(
      "Couldn't auto-fetch this job page — please paste the description manually.",
    );
  }

  const text = extractVisibleText(html);
  if (text.trim().length < 120) {
    throw new Error(
      "Couldn't extract a job description from that page — please paste manually.",
    );
  }
  return text;
}

function extractVisibleText(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    // Remove noise
    doc.querySelectorAll("script,style,noscript,svg,nav,header,footer,form,aside,iframe").forEach(n => n.remove());

    // Prefer semantic containers first
    const candidates: Element[] = [];
    const main = doc.querySelector("main, article, [role='main']");
    if (main) candidates.push(main);
    doc.querySelectorAll("section, div").forEach(d => {
      const t = (d.textContent || "").trim();
      if (t.length > 400) candidates.push(d);
    });

    let best = "";
    for (const c of candidates) {
      const t = normalizeText(c.textContent || "");
      if (t.length > best.length) best = t;
    }
    if (best) return best;
    return normalizeText(doc.body?.textContent || "");
  } catch {
    // Fallback: strip tags naively
    return normalizeText(html.replace(/<[^>]+>/g, " "));
  }
}

function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}