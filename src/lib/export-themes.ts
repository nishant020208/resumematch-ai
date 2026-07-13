import type jsPDF from "jspdf";

export type ExportTheme = "minimal" | "modern" | "classic";

export const THEMES: { id: ExportTheme; label: string; blurb: string }[] = [
  { id: "minimal", label: "Minimal", blurb: "Sparse, monochrome, lots of whitespace." },
  { id: "modern", label: "Modern", blurb: "Lime accent band, sans-serif, bold score." },
  { id: "classic", label: "Classic", blurb: "Serif, ruled sections, traditional look." },
];

type Scan = {
  id: string;
  match_score: number | string;
  resume_name?: string | null;
  created_at: string;
  matched_keywords: any;
  missing_keywords: any;
  suggestions: any;
};

function keywords(list: any): string {
  return (Array.isArray(list) ? list : []).map((m: any) => m.keyword).filter(Boolean).join(", ") || "—";
}

export function renderScanPdf(doc: jsPDF, scan: Scan, dateStr: string, theme: ExportTheme) {
  const score = Math.round(Number(scan.match_score));
  const matched = keywords(scan.matched_keywords);
  const missing = keywords(scan.missing_keywords);
  const suggestions: any[] = Array.isArray(scan.suggestions) ? scan.suggestions : [];

  if (theme === "minimal") {
    let y = 60;
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("Match Report", 48, y); y += 28;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`${dateStr}${scan.resume_name ? `  ·  ${scan.resume_name}` : ""}`, 48, y); y += 30;
    doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(60); doc.text(`${score}`, 48, y); y += 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120); doc.text("out of 100", 48, y + 12); y += 44;
    doc.setTextColor(0);
    section(doc, "Matched", matched, y); y = advance(doc, matched, y + 14) + 18;
    section(doc, "Missing", missing, y); y = advance(doc, missing, y + 14) + 18;
    section(doc, "Suggestions", "", y); y += 14;
    for (const g of suggestions) { const lines = doc.splitTextToSize("· " + g.text, 500); doc.text(lines, 48, y); y += lines.length * 12 + 2; }
  } else if (theme === "modern") {
    // top accent band
    doc.setFillColor(198, 255, 61); doc.rect(0, 0, 612, 12, "F");
    let y = 56;
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text("ResumeMatch AI", 48, y); y += 22;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`${dateStr}${scan.resume_name ? `  ·  ${scan.resume_name}` : ""}`, 48, y); y += 26;
    // score chip
    doc.setFillColor(15, 17, 20); doc.roundedRect(48, y, 180, 90, 8, 8, "F");
    doc.setTextColor(198, 255, 61); doc.setFont("helvetica", "bold"); doc.setFontSize(52); doc.text(`${score}%`, 68, y + 62);
    doc.setTextColor(200); doc.setFontSize(9); doc.text("MATCH SCORE", 68, y + 78);
    y += 110; doc.setTextColor(0);
    modernSection(doc, "MATCHED KEYWORDS", matched, y); y = advance(doc, matched, y + 22) + 16;
    modernSection(doc, "MISSING KEYWORDS", missing, y); y = advance(doc, missing, y + 22) + 16;
    modernSection(doc, "SUGGESTIONS", "", y); y += 22;
    for (const g of suggestions) { const lines = doc.splitTextToSize("→ " + g.text, 500); doc.text(lines, 48, y); y += lines.length * 12 + 2; }
  } else {
    // classic
    let y = 56;
    doc.setFont("times", "bold"); doc.setFontSize(22); doc.text("Resume Match Report", 306, y, { align: "center" }); y += 8;
    doc.setDrawColor(0); doc.setLineWidth(0.5); doc.line(120, y, 492, y); y += 24;
    doc.setFont("times", "italic"); doc.setFontSize(10); doc.text(`${dateStr}${scan.resume_name ? `  —  ${scan.resume_name}` : ""}`, 306, y, { align: "center" }); y += 30;
    doc.setFont("times", "bold"); doc.setFontSize(14); doc.text(`Overall Score: ${score} / 100`, 48, y); y += 22;
    classicSection(doc, "Matched Keywords", matched, y); y = advance(doc, matched, y + 16, "times") + 18;
    classicSection(doc, "Missing Keywords", missing, y); y = advance(doc, missing, y + 16, "times") + 18;
    classicSection(doc, "Suggestions", "", y); y += 16;
    doc.setFont("times", "normal");
    for (const g of suggestions) { const lines = doc.splitTextToSize("• " + g.text, 500); doc.text(lines, 48, y); y += lines.length * 12 + 2; }
  }
}

function section(doc: jsPDF, title: string, body: string, y: number) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(title, 48, y);
  if (body) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(doc.splitTextToSize(body, 500), 48, y + 14); }
}
function modernSection(doc: jsPDF, title: string, body: string, y: number) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(110); doc.text(title, 48, y);
  doc.setDrawColor(198, 255, 61); doc.setLineWidth(1.2); doc.line(48, y + 4, 120, y + 4);
  doc.setTextColor(0);
  if (body) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(doc.splitTextToSize(body, 500), 48, y + 22); }
}
function classicSection(doc: jsPDF, title: string, body: string, y: number) {
  doc.setFont("times", "bold"); doc.setFontSize(12); doc.text(title, 48, y);
  if (body) { doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(doc.splitTextToSize(body, 500), 48, y + 16); }
}
function advance(doc: jsPDF, body: string, y: number, font: "helvetica" | "times" = "helvetica"): number {
  if (!body) return y;
  const sz = font === "times" ? 11 : 10;
  doc.setFont(font, "normal"); doc.setFontSize(sz);
  const lines = doc.splitTextToSize(body, 500);
  return y + lines.length * (sz + 2);
}