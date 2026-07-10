import { embed, cosine } from "./embed-client";
import { extractJdKeywords, keywordPresent } from "./keywords";
import { splitSections } from "./sections";
import { checkAts, type AtsIssue } from "./ats";

export type Suggestion = { severity: "high" | "med" | "low"; text: string };
export type SectionScore = { section: string; score: number };
export type AnalyzeResult = {
  score: number;
  matched: { keyword: string; count: number }[];
  missing: { keyword: string; count: number }[];
  sectionScores: SectionScore[];
  suggestions: Suggestion[];
  atsIssues: AtsIssue[];
};

export async function analyze(resume: string, jd: string): Promise<AnalyzeResult> {
  const sections = splitSections(resume);
  const sectionEntries = Object.entries(sections);
  const inputs = [resume, jd, ...sectionEntries.map(([, v]) => v)];
  const vectors = await embed(inputs);
  const overall = Math.max(0, Math.min(1, (cosine(vectors[0], vectors[1]) + 1) / 2));
  const score = Math.round(overall * 100);

  const sectionScores: SectionScore[] = sectionEntries.map(([name], i) => ({
    section: name,
    score: Math.round(Math.max(0, Math.min(1, (cosine(vectors[2 + i], vectors[1]) + 1) / 2)) * 100),
  }));

  const jdKeywords = extractJdKeywords(jd);
  const matched: { keyword: string; count: number }[] = [];
  const missing: { keyword: string; count: number }[] = [];
  for (const k of jdKeywords) (keywordPresent(resume, k.keyword) ? matched : missing).push(k);

  const suggestions: Suggestion[] = [];
  for (const m of missing.slice(0, 6)) {
    suggestions.push({
      severity: m.count >= 3 ? "high" : m.count >= 2 ? "med" : "low",
      text: `Add "${m.keyword}" — mentioned ${m.count}× in the JD, missing from your resume.`,
    });
  }
  const weak = sectionScores.filter(s => s.score < 55).sort((a, b) => a.score - b.score);
  for (const w of weak.slice(0, 2)) {
    suggestions.push({
      severity: "med",
      text: `Your ${w.section} section has low overlap (${w.score}%) with this JD — strengthen it with role-specific language.`,
    });
  }
  if (score >= 80) suggestions.push({ severity: "low", text: "Strong overall alignment. Tailor the top 3 bullets to mirror the JD phrasing." });

  return { score, matched, missing, sectionScores, suggestions, atsIssues: checkAts(resume) };
}