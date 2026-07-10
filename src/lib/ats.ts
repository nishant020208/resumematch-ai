export type AtsIssue = { level: "warn" | "info"; message: string };

export function checkAts(resume: string): AtsIssue[] {
  const issues: AtsIssue[] = [];
  const wc = resume.trim().split(/\s+/).length;
  if (wc < 250) issues.push({ level: "warn", message: `Resume is short (${wc} words). Aim for 400–800 words for a mid-level role.` });
  if (wc > 1200) issues.push({ level: "warn", message: `Resume is very long (${wc} words). Consider trimming to 1–2 pages.` });
  if (!/[\w.+-]+@[\w-]+\.[\w.-]+/.test(resume)) issues.push({ level: "warn", message: "No email address detected — recruiters may not be able to contact you." });
  if (!/(\+?\d[\s().-]?){7,}/.test(resume)) issues.push({ level: "info", message: "No phone number detected." });
  if (!/linkedin\.com|github\.com|portfolio|website/i.test(resume)) issues.push({ level: "info", message: "No LinkedIn/GitHub/portfolio link detected." });
  const heavyChars = (resume.match(/[│┃┆┇┊┋★☆●○◆◇►▪◦]/g) || []).length;
  if (heavyChars > 5) issues.push({ level: "warn", message: "Decorative characters detected — ATS parsers can drop these lines." });
  const tableChars = (resume.match(/\t/g) || []).length;
  if (tableChars > 20) issues.push({ level: "info", message: "Heavy tab formatting detected — plain paragraphs parse more reliably." });
  return issues;
}