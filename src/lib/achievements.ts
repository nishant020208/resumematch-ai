export type AchievementCode =
  | "first_scan" | "five_scans" | "twenty_scans"
  | "high_match" | "great_match"
  | "streak_3" | "streak_7"
  | "resume_saved" | "two_versions";

export type Achievement = {
  code: AchievementCode;
  title: string;
  description: string;
  emoji: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { code: "first_scan", title: "First Scan", description: "Ran your first match.", emoji: "🎯" },
  { code: "five_scans", title: "5 Scans", description: "Completed 5 scans.", emoji: "🔥" },
  { code: "twenty_scans", title: "20 Scans", description: "Completed 20 scans.", emoji: "🏆" },
  { code: "high_match", title: "80%+ Match", description: "Hit an 80%+ score.", emoji: "⚡" },
  { code: "great_match", title: "90%+ Match", description: "Hit a 90%+ score.", emoji: "🚀" },
  { code: "streak_3", title: "3-Day Streak", description: "Scanned 3 days in a row.", emoji: "🔥" },
  { code: "streak_7", title: "7-Day Streak", description: "Scanned 7 days in a row.", emoji: "🌟" },
  { code: "resume_saved", title: "First Resume Saved", description: "Saved a named resume version.", emoji: "💾" },
  { code: "two_versions", title: "Iterating", description: "Saved 2+ resume versions.", emoji: "🔁" },
];

/** Compute current streak (days) from a sorted list of scan dates (asc or desc — sorted internally). */
export function computeStreak(dates: (string | Date)[]): number {
  if (!dates.length) return 0;
  const days = new Set<string>();
  for (const d of dates) {
    const dt = new Date(d);
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    days.add(key);
  }
  let streak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  // allow today OR yesterday to seed the streak
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!days.has(keyOf(cur))) {
    cur.setDate(cur.getDate() - 1);
    if (!days.has(keyOf(cur))) return 0;
  }
  while (days.has(keyOf(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export type UnlockContext = {
  totalScans: number;
  score: number;
  streak: number;
  savedResumesCount: number;
};

export function evaluateUnlocks(ctx: UnlockContext, already: Set<string>): AchievementCode[] {
  const out: AchievementCode[] = [];
  const add = (c: AchievementCode, cond: boolean) => { if (cond && !already.has(c)) out.push(c); };
  add("first_scan", ctx.totalScans >= 1);
  add("five_scans", ctx.totalScans >= 5);
  add("twenty_scans", ctx.totalScans >= 20);
  add("high_match", ctx.score >= 80);
  add("great_match", ctx.score >= 90);
  add("streak_3", ctx.streak >= 3);
  add("streak_7", ctx.streak >= 7);
  add("resume_saved", ctx.savedResumesCount >= 1);
  add("two_versions", ctx.savedResumesCount >= 2);
  return out;
}