import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd(), "data/mba");

export function sha1(s: string) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

export async function writeInbox(source: string, filename: string, text: string) {
  const dir = path.join(ROOT, "resumes_raw", source, "inbox");
  await fs.promises.mkdir(dir, { recursive: true });
  // dedupe by content hash
  const hash = sha1(text);
  const final = path.join(dir, `${hash}__${filename.replace(/[^\w\.-]+/g, "_")}`);
  await fs.promises.writeFile(final, text, "utf8");
  return final;
}
