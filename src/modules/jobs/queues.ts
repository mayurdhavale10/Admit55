type CollectorSource = "github" | "huggingface" | "kaggle" | "ats";
type Job = { id: string; source: CollectorSource; params: any };

// super-light in-memory queue (swap to BullMQ later)
const q: Job[] = [];
let jobCounter = 0;

export async function enqueueCollector(job: { source: CollectorSource; params: any }) {
  const j: Job = { id: `collector-${++jobCounter}`, source: job.source, params: job.params };
  q.push(j);
  // fire-and-forget worker
  import("./tasks/runCollector").then(mod => mod.runCollector(j).catch(console.error));
  return j;
}
