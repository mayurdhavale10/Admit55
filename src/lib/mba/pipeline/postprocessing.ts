import { loraJsonToSnapshotResult } from "./snapshotNormalize";
import type { SnapshotResult } from "@src/app/mba/tools/profileresumetool/components/types";

// Define a small interface for clarity
interface InferenceMeta {
  method: "lora" | "qlora";
  model?: string;
  adapter?: string;
  latency?: number;
  confidence?: number;
}

/**
 * Normalize the raw JSON output from LoRA inference
 * into a standardized SnapshotResult for the MBA insights UI.
 */
export async function normalizeInferenceOutput(
  rawJson: Record<string, any>, // raw output JSON from LoRA/QLoRA
  meta: InferenceMeta
): Promise<SnapshotResult> {
  return loraJsonToSnapshotResult(rawJson, {
    method: meta.method,
    model: meta.model,
    adapter: meta.adapter,
    latencyMs: meta.latency,
    confidence: rawJson?.confidence ?? meta.confidence ?? 0.7,
  });
}
