// Split a resume into rough sections by common headers
const HEADERS = [
  { key: "skills", re: /^(technical\s+)?skills?(\s*&\s*tools)?\s*:?$/i },
  { key: "experience", re: /^(work\s+)?(professional\s+)?experience\s*:?$/i },
  { key: "education", re: /^education\s*:?$/i },
  { key: "projects", re: /^(personal\s+)?projects?\s*:?$/i },
  { key: "summary", re: /^(summary|profile|about)\s*:?$/i },
  { key: "certifications", re: /^(certifications?|licenses?)\s*:?$/i },
];

export type ResumeSections = Partial<Record<
  "summary" | "skills" | "experience" | "projects" | "education" | "certifications",
  string
>>;

export function splitSections(resume: string): ResumeSections {
  const lines = resume.split(/\r?\n/);
  const out: Record<string, string[]> = {};
  let current = "other";
  for (const raw of lines) {
    const line = raw.trim();
    const match = HEADERS.find(h => h.re.test(line));
    if (match) { current = match.key; continue; }
    if (!line) continue;
    (out[current] ??= []).push(raw);
  }
  const result: ResumeSections = {};
  for (const k of ["summary","skills","experience","projects","education","certifications"] as const) {
    if (out[k]?.length) result[k] = out[k].join("\n");
  }
  return result;
}