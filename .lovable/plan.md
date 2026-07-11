# Resonate — Feature Expansion Plan

Building **on top of** the existing app. No restructuring. All AI stays 100% in-browser.

---

## 1. JD Auto-Paste from URL
- New `src/lib/jd-fetch.ts`: try `fetch(url)` → strip HTML → extract visible text (heuristic: pull `<main>`, `<article>`, or largest `<div>` text block). Wrap in try/catch for CORS.
- Add URL input above the JD textarea on `scan.tsx`. On failure, toast + inline message "Couldn't auto-fetch this job page — please paste manually." Manual textarea stays always visible.

## 2. Resume Version Diff View
- Add `diff` package (tiny, ~15KB) via `bun add diff`.
- New route `src/routes/_authenticated/resumes.diff.tsx`: two dropdowns to pick versions, side-by-side (or unified) diff with green added / red removed / neutral unchanged.
- Above the diff: run `analyze()` for each version against a JD the user selects from history (or paste one) → show two `ScoreRing`s.
- Link into it from `resumes.tsx` when ≥2 versions exist.

## 3. "Optimize This Line" Suggestions
- New `src/lib/line-optimize.ts`: given a line + missing JD keywords, produce 2–3 rephrasings via templates (e.g. "Leveraged {kw} to …", "Built with {kw} …", inject keyword naturally into original clause).
- Score each candidate via existing `embed()` + cosine vs JD embedding.
- New `src/components/line-optimizer.tsx`: popover triggered from resume textarea. Since selecting text in a `<textarea>` is fiddly, render the resume in "Optimize" mode as a list of clickable lines below the textarea. Click a line → popover with ranked alternatives, "copy" button.

## 4. Shareable Match Score Card
- `bun add html-to-image`.
- New `src/components/share-card.tsx`: hidden off-screen 1200×630 div styled with dark bg + lime accent + subtle grid pattern + score + "X% match" + "resonate" wordmark.
- "Share Result" button on scan results + history detail → renders to PNG. Two actions: **Download** (anchor) and **Copy image** (`navigator.clipboard.write([new ClipboardItem])` with PNG blob; fallback toast if unsupported).

## 5. Multi-JD Batch Compare
- New route `src/routes/_authenticated/batch.tsx`: resume picker (saved versions dropdown or paste) + repeatable list of JD inputs (add/remove).
- On run, loop `analyze()` for each JD (sequential — worker is single). Show progress. Ranked table sorted by score, expandable rows revealing per-JD keyword gaps + suggestions.

## 6. Skill Radar Chart
- Extend `src/lib/keywords.ts` with `SKILL_TAXONOMY: Record<Category, string[]>` — 5 buckets: Frontend, Backend, DevOps/Tools, Soft Skills, Core CS/DSA. Add Core CS/DSA terms (Algorithms, Data Structures, Big-O, Concurrency, OS, Networking, Databases, System Design…).
- Helper `categoryScores(resume, jd)` → per category, (resume-hits / jd-hits) × 100, floor 0, cap 100.
- New `src/components/skill-radar.tsx` using recharts `RadarChart` with two series (resume vs JD demand). Render on scan results page next to `ScoreRing`.

## 7. Full PWA with Offline Model
Per PWA skill (`generateSW` route, guarded wrapper):
- `bun add -d vite-plugin-pwa`. Add plugin to `vite.config.ts` with:
  - `registerType: "autoUpdate"`, `injectRegister: null`, `devOptions.enabled: false`
  - manifest: name "Resonate", short_name, theme_color `#c6ff3d`, background_color `#0a0b0d`, `display: "standalone"`, icons (512/192 generated).
  - `workbox.runtimeCaching`:
    - navigations → `NetworkFirst` (SPA fallback still works), exclude `/~oauth`
    - HuggingFace CDN (`huggingface.co`, `cdn-lfs.huggingface.co`) → `CacheFirst`, long expiration → **caches model files on first load**
    - transformers.js WASM/JSON assets → `CacheFirst`
    - same-origin hashed assets → `CacheFirst`
- New `src/lib/pwa-register.ts`: guarded wrapper (refuses on preview/iframe/`?sw=off`), imported from `__root.tsx`.
- Generate icon PNGs (192 + 512) via imagegen at `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`. Add head `<link rel="manifest">` etc. in `__root.tsx`.
- New `src/components/online-badge.tsx`: subscribes to `online`/`offline` events + listens for SW `activated` → toast "Resonate is ready to use offline." Small dot in `Nav`.

## 8. Resume Heatmap
- Extend `analyze.ts`: also embed each **line** (or sentence, min length 20 chars) → cosine vs JD → return `lineScores: {text, score}[]`.
- New `src/components/resume-heatmap.tsx`: toggle button on results. Renders lines with `background: color-mix(in oklch, var(--acid) ${intensity}%, transparent)`. Legend: 4-step gradient bar.
- Guard cost: cap at ~120 lines to keep the extra embed pass fast.

## 9. Interview Question Predictor
- New `src/lib/interview-bank.ts`: `Record<keyword, string[]>` for 25–40 common skills (Docker, K8s, SQL, System Design, React, Node, Python, AWS, Testing, CI/CD, Leadership, etc.).
- New `src/components/interview-panel.tsx`: takes `missing` keywords → pick top gaps that appear in the bank → surface 3–5 questions with "Practice questions based on your gaps" heading + disclaimer "curated question bank, not AI-generated."
- Render on scan results + history detail.

---

## Files to add/modify (high level)
- **New libs**: `jd-fetch.ts`, `line-optimize.ts`, `interview-bank.ts`, `pwa-register.ts`
- **New components**: `share-card.tsx`, `skill-radar.tsx`, `resume-heatmap.tsx`, `interview-panel.tsx`, `line-optimizer.tsx`, `online-badge.tsx`
- **New routes**: `_authenticated/batch.tsx`, `_authenticated/resumes.diff.tsx`
- **Modified**: `keywords.ts` (+taxonomy), `analyze.ts` (+lineScores, +categoryScores), `scan.tsx` (URL input, radar, heatmap toggle, share, interview, optimizer), `history.$id.tsx` (share, interview, radar), `resumes.tsx` (link to diff), `nav.tsx` (online badge, batch link), `__root.tsx` (manifest links, SW register), `vite.config.ts` (PWA plugin), `package.json` (deps)
- **New public assets**: `public/manifest.webmanifest`, `public/icons/*`

## Non-negotiables
- No new colors — stay on dark + `--acid` lime tokens.
- Every new screen: mobile-first, loading/empty/error states.
- Existing scan/auth/history/compare/export untouched functionally.
- All computation client-side; privacy badge copy updated to mention new features are also on-device.
- SW guards preserve TanStack Router deep-link reloads (NetworkFirst navigations, no cache-first HTML).

Approve to build.