import { embed, cosine } from "./embed-client";
import { keywordPresent } from "./keywords";

export type LineSuggestion = { text: string; score: number; improvement: number };

function stripTrailingPunct(s: string) {
  return s.replace(/[.·•–—-]+\s*$/, "").trim();
}

/**
 * Generate 2-3 alternative phrasings of `line` that naturally inject
 * missing JD keywords, then score each with the local embedding model
 * against the JD vector. Rule-based + embedding only — no generative AI.
 */
export async function optimizeLine(
  line: string,
  missingKeywords: string[],
  jdVector: number[],
): Promise<{ original: { text: string; score: number }; suggestions: LineSuggestion[] }> {
  const base = stripTrailingPunct(line);
  const relevant = missingKeywords
    .filter(k => !keywordPresent(base, k))
    .slice(0, 4);

  const templates = (kw: string) => [
    `${base}, leveraging ${kw} to deliver measurable impact.`,
    `Applied ${kw} to ${lowerFirst(base)}.`,
    `${base} — using ${kw} and modern best practices.`,
  ];

  const candidateSet = new Set<string>();
  if (relevant.length >= 2) {
    // Combine two most-relevant keywords in one variant
    candidateSet.add(`${base}, using ${relevant[0]} and ${relevant[1]}.`);
  }
  for (const kw of relevant) {
    for (const t of templates(kw)) candidateSet.add(t);
    if (candidateSet.size >= 6) break;
  }
  const candidates = [...candidateSet].slice(0, 6);
  if (candidates.length === 0) {
    return { original: { text: line, score: 0 }, suggestions: [] };
  }

  const vectors = await embed([base, ...candidates]);
  const origScore = pct(cosine(vectors[0], jdVector));
  const scored: LineSuggestion[] = candidates.map((text, i) => {
    const s = pct(cosine(vectors[1 + i], jdVector));
    return { text, score: s, improvement: s - origScore };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    original: { text: line, score: origScore },
    suggestions: scored.slice(0, 3),
  };
}

function pct(c: number) { return Math.round(Math.max(0, Math.min(1, (c + 1) / 2)) * 100); }
function lowerFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1); }