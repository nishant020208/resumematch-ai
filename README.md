# ResumeMatch AI

**Match your resume to any job description — locally, in your browser, with zero data upload.**

---

> 🔒 **Why On-Device?**
> Your resume is some of the most sensitive text you own — full work history, contact details, career trajectory. ResumeMatch AI runs its entire AI pipeline inside your browser tab using a Web Worker. The text you paste never leaves your machine, is never sent to a server, and is never logged. The model runs on your CPU. You own the inference.

---

## Short Description

ResumeMatch AI is a browser-native tool that scores how well your resume matches a job description using a real sentence-embedding model running entirely on-device. It surfaces matched and missing keywords, breaks the score down by resume section, flags ATS readability issues, and generates targeted rewrite suggestions — all without sending your resume to any server.

---

## Problem Statement

Job seekers — particularly software engineers and technical candidates — paste their resumes into cloud-based ATS checkers, resume scoring tools, and AI writing assistants without realising their full work history, personal contact info, and career details are being uploaded, stored, and potentially used for training. Existing tools also give opaque scores with no actionable detail: "your resume is 62% matched" with no breakdown of why or what to fix.

The target user is a developer or technically-literate job seeker who wants honest, granular feedback without surrendering their data to a third party.

---

## Solution Overview

ResumeMatch AI puts the embedding model directly in the browser. The user pastes a resume and a job description; a Web Worker loads `all-MiniLM-L6-v2` via Transformers.js, computes sentence embeddings for both documents and for each detected resume section, and calculates cosine similarity scores locally. On top of the semantic match score, a curated skill-bank keyword matcher identifies exactly which JD terms are present or missing from the resume. The result is a numeric match score (0–100), per-section scores, matched/missing keyword chips, prioritised rewrite suggestions, and an ATS readability audit — all rendered instantly in the browser with no round-trip to a server.

Authenticated users (optional, via Supabase) can save named resume versions, build a scan history, compare up to three scans side-by-side, and view aggregated skill-gap insights across all their past scans.

---

## On-Device AI Usage

### What runs locally

| Feature | Detail |
|---|---|
| **Resume-to-JD semantic matching** | Cosine similarity of full-document embeddings computed in-browser |
| **Per-section semantic scoring** | Individual embeddings computed for Skills, Experience, Projects, Education, Summary, Certifications sections |
| **Keyword gap analysis** | Curated 130+ skill-bank + frequency-based extraction — pure JS, no network |
| **ATS readability checks** | Regex heuristics for word count, contact info, decorative characters — pure JS, no network |
| **Rewrite suggestions** | Generated from local embedding scores and keyword tallies — no LLM API call |

### Model

| Field | Value |
|---|---|
| **Model name** | `all-MiniLM-L6-v2` |
| **Checkpoint identifier** | `Xenova/all-MiniLM-L6-v2` |
| **Source** | [Hugging Face Hub](https://huggingface.co/Xenova/all-MiniLM-L6-v2) — ONNX-converted for browser use |
| **Approximate size** | ~30 MB (ONNX weights, cached in browser IndexedDB after first load) |
| **Original license** | Apache 2.0 |
| **Runtime** | `@xenova/transformers` (Transformers.js) via WASM on a dedicated Web Worker, off the main thread |
| **Execution environment** | Any modern desktop or mobile browser (Chrome, Firefox, Safari, Edge); no GPU required |

### Data privacy guarantee

**No core AI input data leaves the user's device.** The resume text, job description text, computed embedding vectors, match scores, keyword lists, and suggestions are all generated locally. The Web Worker (`src/workers/embed.worker.ts`) communicates only with the browser's own thread via `postMessage`.

### Cloud services used (non-core only)

| Service | Purpose | AI inference? |
|---|---|---|
| **Supabase** | Optional user auth (email/password), persistent storage of saved resumes and scan history | No |
| **Lovable / Cloudflare (hosting)** | Static site hosting and SSR edge delivery | No |

Cloud services are strictly limited to auth, persistence, and delivery. The core AI inference — embedding, scoring, keyword analysis — never touches a cloud API.

---

## Tech Stack

| Category | Tool / Library |
|---|---|
| **Framework** | TanStack Start (React 19, file-based routing, SSR) |
| **Language** | TypeScript 5.8 |
| **AI runtime** | `@xenova/transformers` (Transformers.js, WASM Web Worker) |
| **AI model** | `Xenova/all-MiniLM-L6-v2` (sentence embeddings, ONNX) |
| **File parsing** | `mammoth` (DOCX), `pdfjs-dist` (PDF), native `File.text()` (TXT) — all client-side |
| **Styling** | Tailwind CSS v4 |
| **UI components** | Radix UI primitives + shadcn/ui |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Auth & DB** | Supabase (PostgreSQL, Row-Level Security, email auth) |
| **State / data fetching** | TanStack Query v5 |
| **Build tool** | Vite 8 + Bun |
| **Deployment** | Lovable Cloud (Cloudflare edge, Nitro SSR) |
| **Package manager** | Bun |

---

## Setup Instructions

> Assumes Node.js 18+ or Bun 1.x installed. Bun is preferred (lockfile is `bun.lock`).

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/resumematch-ai.git
cd resumematch-ai
```

### 2. Install dependencies

```bash
bun install
```

> If you prefer npm: `npm install` also works, but use `bun` for consistency with the lockfile.

### 3. Configure environment variables

Create a `.env` file in the repo root. You need a [Supabase](https://supabase.com) project for auth and history features. The core scan functionality (AI matching) works without Supabase — it just won't persist results.

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

> The `.env` file is gitignored. Never commit real keys.

**Optional: run Supabase migrations**

To enable scan history and resume saving, apply the schema to your Supabase project via the SQL editor or CLI:

```bash
npx supabase db push
```

Or apply the SQL files in `supabase/migrations/` manually via the Supabase dashboard.

### 4. Start the development server

```bash
bun run dev
```

### 5. Open the app

Navigate to **http://localhost:3000** in your browser.

The first time you run a scan, the browser will download and cache the `all-MiniLM-L6-v2` ONNX model (~30 MB). Subsequent scans load the cached model instantly from IndexedDB.

---

## Usage Instructions

### Guest mode (no account required)

1. **Open the app** at the local or deployed URL.
2. **Navigate to `/scan`** (or click **"run a scan"** on the landing page).
3. **Paste your resume text** into the left panel. Alternatively, click the file drop button to upload a `.pdf`, `.docx`, or `.txt` file — text is extracted client-side.
4. **Paste the job description** into the right panel. File upload works here too.
5. **Click "analyze"**. Watch the model loading progress bar if this is your first scan (model loads once, then caches). Analysis starts automatically when the model is ready.
6. **Read your results**:
   - **Score ring** — overall semantic match score (0–100).
   - **Section breakdown** — per-section scores (Skills, Experience, Projects, Education, etc.) with animated progress bars.
   - **Matched keywords** — terms from the JD found in your resume, shown as green chips.
   - **Missing keywords** — JD terms absent from your resume, shown as red chips (prioritise these).
   - **Suggestions** — severity-ranked, specific rewrite hints (e.g. "Add 'Kubernetes' — mentioned 3x in the JD").
   - **ATS readability warnings** — flags for missing contact info, decorative characters, and word-count issues.

### Signed-in mode (optional)

7. **Create an account** at `/auth` (email + password, via Supabase).
8. **Save resume versions** — name them (e.g. "Backend-focused", "Fullstack") and reuse them across scans without re-pasting.
9. **View scan history** at `/history` — search past scans by JD text or resume name, click into any scan to see full result detail.
10. **Compare scans** at `/compare` — select 2–3 past scans to view side-by-side score rings and keyword lists.
11. **View skill insights** at `/insights` — bar charts of your most-missed and most-matched skills aggregated across all past scans. Use this to prioritise what to learn or add to your resume.

---

## Demo Video

**[Demo Video: add link here — 2 to 5 minutes, hosted on YouTube/Drive/Loom/Vimeo, publicly accessible without permission]**

Suggested content for the demo:
- Open the app cold and show the model loading (Web Worker progress bar)
- Paste a sample resume and job description, run a scan, narrate the results panels
- Show the scan history and skill insights pages for a signed-in user
- Briefly open DevTools Network tab to demonstrate zero resume-text requests leaving the browser

---

## License

This project is licensed under the **MIT License** — OSI-compliant. ✅

A `LICENSE` file exists at the repo root.

---

## Known Limitations & Future Scope

- **Cold-start model download.** The `all-MiniLM-L6-v2` ONNX weights are ~30 MB and are fetched from the Hugging Face CDN on first use. After the initial download the browser caches the model in IndexedDB and all subsequent scans are instant. First-load latency on slow connections can be noticeable. [TODO: measure and add local inference time after model is warm]
- **Small model accuracy tradeoffs.** MiniLM-L6-v2 is a 22M-parameter sentence encoder optimised for speed and browser compatibility. It captures semantic similarity well but can miss nuanced domain-specific jargon or conflate similar-sounding but functionally different technologies (e.g. Kafka vs. RabbitMQ). A larger model (e.g. `all-mpnet-base-v2`, ~420 MB) would improve accuracy but is impractical in a browser context.
- **Text-only input.** PDF and DOCX files are extracted as plain text client-side. Visually rich, multi-column, or table-heavy resume layouts may produce garbled extraction, leading to misleading scores. Users should verify the extracted text in the paste panel before running a scan.
- **Keyword bank is curated, not learned.** The 130+ term skill bank (`src/lib/keywords.ts`) was hand-curated for software and tech roles. It does not cover all industries, seniority levels, or international job markets. Highly specialised roles (biotech, finance, law) will have lower keyword recall.
- **No fully offline persistence.** Running the app without Supabase credentials disables auth, scan history, resume saving, insights, and compare. A localStorage-only fallback persistence layer for offline use is a clear future improvement.

---

## Acknowledgements / Attribution

| Resource | Role | License |
|---|---|---|
| [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2) | ONNX-converted sentence embedding model used for all semantic matching | Apache 2.0 |
| [sentence-transformers / `all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | Original model (fine-tuned MiniLM) by the sentence-transformers team | Apache 2.0 |
| [`@xenova/transformers`](https://github.com/xenova/transformers.js) | Transformers.js — runs Hugging Face ONNX models in the browser via WASM | Apache 2.0 |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | WASM inference backend used internally by Transformers.js | MIT |
| [Supabase](https://supabase.com) | Auth and PostgreSQL database backend (optional, non-core) | Apache 2.0 (client SDK) |
| [TanStack](https://tanstack.com) | Router, Start SSR framework, and Query | MIT |
| [Radix UI](https://www.radix-ui.com) | Accessible headless UI primitives | MIT |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first CSS framework | MIT |
| [Framer Motion](https://www.framer.com/motion/) | Animation library | MIT |
| [Recharts](https://recharts.org) | Chart library for score trend and skill insights | MIT |
| [Lucide React](https://lucide.dev) | Icon set | ISC |
| [shadcn/ui](https://ui.shadcn.com) | Component recipes built on Radix UI | MIT |
