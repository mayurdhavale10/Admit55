import { createHash } from "crypto";
const mem = new Map<string,string>();
export function keyFor(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
export function getCached(key: string) { return mem.get(key); }
export function setCached(key: string, value: string) { mem.set(key, value); }
