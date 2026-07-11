// Curated interview questions mapped to common skills / gap categories.
// Fully static local lookup. No AI generation.
export const INTERVIEW_BANK: Record<string, string[]> = {
  Docker: [
    "Walk me through a multi-stage Dockerfile you've written and why each stage exists.",
    "How do you keep production image sizes small without breaking builds?",
    "What happens when a container OOMs, and how would you debug it?",
  ],
  Kubernetes: [
    "Explain the difference between a Deployment, StatefulSet, and DaemonSet.",
    "How does a Service route traffic to healthy pods?",
    "Describe a rolling update you configured — what were the readiness/liveness probes?",
  ],
  AWS: [
    "How would you design an S3 + Lambda + API Gateway flow for a file upload feature?",
    "When would you pick DynamoDB over RDS and why?",
    "How do you scope IAM permissions for a service that only needs read access to one bucket?",
  ],
  GCP: ["How does Cloud Run differ from GKE for a stateless HTTP service?", "How would you secure a service-to-service call between two Cloud Run services?"],
  Azure: ["When would you choose Azure Functions over App Service?", "How do you manage secrets across environments in Azure?"],
  Terraform: [
    "How do you handle Terraform state in a team of 10+ engineers?",
    "Walk through what happens on `terraform plan` vs `terraform apply`.",
  ],
  "CI/CD": [
    "Describe your ideal PR-to-production pipeline for a web service.",
    "How do you prevent a bad deploy from taking down production?",
  ],
  "System Design": [
    "Design a URL shortener that handles 10k writes/sec — walk through the components.",
    "How would you scale a feed for 1M active users?",
    "Where would you place a cache and how would you invalidate it?",
  ],
  "Distributed Systems": [
    "Explain the CAP theorem and how it influenced a system you built.",
    "Walk through how you'd handle exactly-once delivery in an async pipeline.",
  ],
  Microservices: [
    "When have you split a monolith and how did you decide the seams?",
    "How do you handle a schema change that spans three services?",
  ],
  SQL: [
    "Walk me through diagnosing a slow query — where do you start?",
    "When would you add an index vs restructure the query?",
    "How do you avoid N+1 queries in an ORM?",
  ],
  PostgreSQL: [
    "Explain MVCC and how it affects long-running transactions.",
    "What's the difference between a B-tree and a GIN index?",
  ],
  MongoDB: ["How do you decide between embedding and referencing?", "How does a compound index differ from multiple single-field indexes?"],
  Redis: ["How would you use Redis to implement a rate limiter?", "Explain the trade-offs between LRU and LFU eviction."],
  Kafka: ["Explain how partitioning affects ordering guarantees.", "How would you handle a consumer that keeps crashing on the same message?"],
  React: [
    "When does a re-render become a performance problem and how do you fix it?",
    "Explain the mental model behind useEffect's dependency array.",
    "How would you architect a large form with 30+ fields?",
  ],
  TypeScript: [
    "When would you use a discriminated union vs a class hierarchy?",
    "How do you type a function that returns different shapes based on input?",
  ],
  "Node.js": ["Explain the event loop and give an example of blocking it.", "How do you handle uncaught promise rejections in production?"],
  Python: ["Explain the difference between a generator and an iterator.", "How do you profile a slow Python service?"],
  Go: ["When would you pick a channel over a mutex?", "Explain how goroutines are scheduled."],
  Rust: ["Walk through borrow checking with an example that fails to compile.", "When would you reach for `unsafe`?"],
  Java: ["Explain the difference between checked and unchecked exceptions.", "When would you use a ThreadPoolExecutor vs a CompletableFuture?"],
  GraphQL: ["How do you handle N+1 in resolvers?", "How do you version a GraphQL schema safely?"],
  "REST API": ["When would you use PATCH vs PUT?", "How do you design pagination that scales past 1M rows?"],
  gRPC: ["Explain streaming modes and when you'd use each.", "How do you handle backward-incompatible schema changes?"],
  "Machine Learning": ["Walk through how you'd frame a churn prediction problem.", "How do you evaluate a classifier with imbalanced classes?"],
  NLP: ["Explain how a transformer's attention mechanism works.", "How would you evaluate the quality of a summarization model?"],
  LLM: ["When would you fine-tune vs prompt-engineer?", "How would you evaluate a RAG pipeline for factuality?"],
  Testing: ["Walk through the difference between unit, integration, and E2E tests — where do you invest?", "How do you keep a flaky test suite from eroding trust?"],
  Playwright: ["How do you avoid flaky selectors in Playwright?", "How would you parallelize a Playwright suite across CI shards?"],
  Agile: ["How do you handle scope creep mid-sprint?", "When has a retrospective actually changed how your team worked?"],
  Leadership: ["Walk me through a time you disagreed with a senior stakeholder — how did it resolve?", "How do you decide when to code yourself vs unblock others?"],
  Mentoring: ["How do you structure feedback for a junior engineer you're pairing with?"],
  "Cross-functional": ["Walk me through a project where design, PM, and eng were misaligned — how did you get it back on track?"],
  "Product Sense": ["How do you decide what to cut when a launch is at risk?"],
};

export function pickInterviewQuestions(missing: { keyword: string; count: number }[]): { keyword: string; question: string }[] {
  const out: { keyword: string; question: string }[] = [];
  const seen = new Set<string>();
  for (const m of missing) {
    const bank = INTERVIEW_BANK[m.keyword];
    if (!bank) continue;
    for (const q of bank) {
      if (seen.has(q)) continue;
      seen.add(q);
      out.push({ keyword: m.keyword, question: q });
      if (out.length >= 5) return out;
      break; // one question per gap first, wider variety
    }
  }
  // second pass — fill up to 5 if needed
  for (const m of missing) {
    const bank = INTERVIEW_BANK[m.keyword];
    if (!bank) continue;
    for (const q of bank) {
      if (seen.has(q)) continue;
      seen.add(q); out.push({ keyword: m.keyword, question: q });
      if (out.length >= 5) return out;
    }
  }
  return out;
}