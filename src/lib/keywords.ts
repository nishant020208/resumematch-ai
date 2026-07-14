// Curated tech + soft-skill keyword bank for gap analysis
export const SKILL_BANK: string[] = [
  // languages
  "JavaScript","TypeScript","Python","Go","Rust","Java","Kotlin","Swift","C#","C++","Ruby","PHP","Scala","Elixir",
  // frontend
  "React","Next.js","Vue","Svelte","Angular","Remix","Redux","Tailwind","CSS","HTML","Webpack","Vite","GraphQL","Apollo",
  // backend
  "Node.js","Express","NestJS","Django","Flask","FastAPI","Spring","Rails","Laravel",".NET","gRPC","REST API","WebSocket","OAuth","JWT","OpenAPI",
  // data
  "PostgreSQL","MySQL","MongoDB","Redis","Elasticsearch","Kafka","RabbitMQ","Snowflake","BigQuery","DynamoDB","SQL","NoSQL","ETL","Airflow","dbt","Spark","Hadoop","Pandas","NumPy",
  // cloud/devops
  "AWS","GCP","Azure","Docker","Kubernetes","Terraform","Ansible","CI/CD","GitHub Actions","Jenkins","CircleCI","Linux","Nginx","Cloudflare","Serverless","Lambda","S3","EC2","RDS","IAM",
  // ml/ai
  "Machine Learning","Deep Learning","PyTorch","TensorFlow","Transformers","LLM","NLP","Computer Vision","RAG","Embeddings","Vector Database","Pinecone","LangChain",
  // mobile
  "iOS","Android","React Native","Flutter","Expo",
  // testing
  "Jest","Vitest","Cypress","Playwright","Selenium","JUnit","PyTest","TDD",
  // methodology
  "Agile","Scrum","Kanban","Microservices","Monorepo","Design Patterns","System Design","Distributed Systems","Event-Driven","DDD",
  // soft skills
  "Leadership","Mentoring","Communication","Collaboration","Ownership","Problem Solving","Stakeholder Management","Cross-functional","Product Sense","Prioritization",
];

// Category taxonomy for the radar chart. Keywords should be a subset of the
// concepts we recognize in resumes/JDs (matched via normalized substring).
export type SkillCategory = "Frontend" | "Backend" | "DevOps/Tools" | "Soft Skills" | "Core CS/DSA";

export const SKILL_TAXONOMY: Record<SkillCategory, string[]> = {
  Frontend: [
    "React","Next.js","Vue","Svelte","Angular","Remix","Redux","Tailwind","CSS","HTML","Webpack","Vite","GraphQL","Apollo","TypeScript","JavaScript","React Native","Flutter","Accessibility","Responsive",
  ],
  Backend: [
    "Node.js","Express","NestJS","Django","Flask","FastAPI","Spring","Rails","Laravel",".NET","gRPC","REST API","WebSocket","OAuth","JWT","OpenAPI","Python","Go","Rust","Java","Kotlin","Ruby","PHP","Scala","Elixir","Microservices",
  ],
  "DevOps/Tools": [
    "AWS","GCP","Azure","Docker","Kubernetes","Terraform","Ansible","CI/CD","GitHub Actions","Jenkins","CircleCI","Linux","Nginx","Cloudflare","Serverless","Lambda","S3","EC2","RDS","IAM","Monitoring","Observability","Prometheus","Grafana","Git",
  ],
  "Soft Skills": [
    "Leadership","Mentoring","Communication","Collaboration","Ownership","Problem Solving","Stakeholder Management","Cross-functional","Product Sense","Prioritization","Agile","Scrum","Kanban",
  ],
  "Core CS/DSA": [
    "Algorithms","Data Structures","Big-O","Concurrency","Multithreading","Operating Systems","Networking","Databases","System Design","Distributed Systems","Design Patterns","Object-Oriented","Functional Programming","Compilers","Caching","Complexity","Recursion","Graphs","Dynamic Programming",
  ],
};

export function normalizeKw(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+.# ]/g, " ").replace(/\s+/g, " ").trim();
}

function countOccurrences(hay: string, needle: string): number {
  const h = " " + normalizeKw(hay) + " ";
  const n = " " + normalizeKw(needle) + " ";
  if (!n.trim()) return 0;
  let idx = 0, c = 0;
  while ((idx = h.indexOf(n, idx)) !== -1) { c++; idx += n.length; }
  return c;
}

export type CategoryScore = { category: SkillCategory; resume: number; jd: number };

export function categoryScores(resume: string, jd: string): CategoryScore[] {
  const cats = Object.keys(SKILL_TAXONOMY) as SkillCategory[];
  return cats.map(cat => {
    const kws = SKILL_TAXONOMY[cat];
    let jdHits = 0, resumeHits = 0, jdSkillsPresent = 0, resumeCovered = 0;
    for (const k of kws) {
      const jc = countOccurrences(jd, k);
      const rc = countOccurrences(resume, k);
      jdHits += jc;
      resumeHits += rc;
      if (jc > 0) {
        jdSkillsPresent++;
        if (rc > 0) resumeCovered++;
      }
    }
    // JD "demand" score: normalized breadth of category keywords present in JD
    const jdScore = Math.round(Math.min(100, (jdHits / Math.max(1, kws.length * 0.3)) * 100));
    // Resume score: fraction of JD-demanded skills present, or breadth if JD sparse
    const resumeScore = jdSkillsPresent > 0
      ? Math.round((resumeCovered / jdSkillsPresent) * 100)
      : Math.round(Math.min(100, (resumeHits / Math.max(1, kws.length * 0.3)) * 100));
    return { category: cat, resume: resumeScore, jd: jdScore };
  });
}

const STOPWORDS = new Set(("a an the and or but if while of in on at to for with by from as is are was were be been being have has had do does did will would should could may might must can this that these those i you he she it we they them us our your his her their its as also into over under about between within without such not no nor so than then too very just".split(" ")));

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+.# ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Extract keywords from JD: skill-bank matches + frequent multi-word ngrams. */
export function extractJdKeywords(jd: string): { keyword: string; count: number }[] {
  const lower = " " + normalize(jd) + " ";
  const found = new Map<string, number>();
  for (const skill of SKILL_BANK) {
    const needle = " " + normalize(skill) + " ";
    let idx = 0, count = 0;
    while ((idx = lower.indexOf(needle, idx)) !== -1) { count++; idx += needle.length; }
    if (count > 0) found.set(skill, count);
  }
  // frequency-based single words (not in stopwords, len >= 4) as fallback
  const tokens = lower.trim().split(" ").filter(t => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const cap = [...freq.entries()].filter(([w, c]) => c >= 3 && !SKILL_BANK.some(s => normalize(s).includes(w)))
    .sort((a, b) => b[1] - a[1]).slice(0, 8);
  for (const [w, c] of cap) {
    const nice = w.charAt(0).toUpperCase() + w.slice(1);
    if (!found.has(nice)) found.set(nice, c);
  }
  return [...found.entries()].map(([keyword, count]) => ({ keyword, count })).sort((a, b) => b.count - a.count);
}

export function keywordPresent(resume: string, kw: string): boolean {
  const r = " " + normalize(resume) + " ";
  return r.includes(" " + normalize(kw) + " ");
}