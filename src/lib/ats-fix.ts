/** Client-side ATS-safe rewriter. Strips decorative characters, normalizes bullets,
 *  collapses tables (tab-separated cells) into inline text, and cleans whitespace. */

const BULLET_CHARS = /[•●○◆◇►▪◦∙·▶✦✧✔✓✱★☆]/g;
const DECOR = /[│┃┆┇┊┋╌╎╏═╬║╣╠╦╩┼─│┌┐└┘├┤┬┴]/g;
const SMART = new Map<string, string>([
  ["\u2018", "'"], ["\u2019", "'"], ["\u201C", '"'], ["\u201D", '"'],
  ["\u2013", "-"], ["\u2014", "-"], ["\u2026", "..."], ["\u00A0", " "],
  ["\u200B", ""], ["\uFE0F", ""], ["\u2022", "-"], ["\u25CF", "-"],
]);

export function cleanForAts(input: string): string {
  let out = input;
  // normalize newlines
  out = out.replace(/\r\n?/g, "\n");
  // smart chars
  out = out.replace(/./g, ch => SMART.get(ch) ?? ch);
  // decorative box / heavy separators
  out = out.replace(DECOR, " ");
  // any bullet-like glyph → "- "
  out = out.replace(BULLET_CHARS, "-");
  // collapse tables: line with 2+ tabs → cells joined by " · "
  out = out.split("\n").map(line => {
    if ((line.match(/\t/g) ?? []).length >= 2) {
      return line.split(/\t+/).map(c => c.trim()).filter(Boolean).join(" · ");
    }
    return line.replace(/\t+/g, "  ");
  }).join("\n");
  // multi-column heuristic: line with 4+ groups of "word{2+ spaces}word" → normalize spacing
  out = out.split("\n").map(line => {
    if (/(\S+ {2,}){3,}\S+/.test(line)) return line.replace(/ {2,}/g, " · ");
    return line;
  }).join("\n");
  // make bullet lines uniform: "-item" -> "- item"
  out = out.replace(/^(\s*)-(?!\s)/gm, "$1- ");
  // strip trailing spaces
  out = out.replace(/[ \t]+$/gm, "");
  // collapse >2 blank lines
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

/** Quick summary of what would change (for the preview UI). */
export function fixSummary(before: string, after: string): { removedChars: number; normalizedLines: number } {
  const removedChars = Math.max(0, before.length - after.length);
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  let changed = 0;
  const len = Math.min(beforeLines.length, afterLines.length);
  for (let i = 0; i < len; i++) if (beforeLines[i] !== afterLines[i]) changed++;
  changed += Math.abs(beforeLines.length - afterLines.length);
  return { removedChars, normalizedLines: changed };
}