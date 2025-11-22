// small, sync SHA-256 (node ≥18)
import { createHash } from "crypto";
export function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
