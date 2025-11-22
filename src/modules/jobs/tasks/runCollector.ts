import { runGitHubCollector } from "@src/modules/collector/github";

type CollectorSource = "github" | "huggingface" | "kaggle" | "ats";
type Job = { id: string; source: CollectorSource; params: any };

export async function runCollector(job: Job) {
  const { source, params } = job;
  if (source === "github") return runGitHubCollector(params);
  // add other sources here
}
