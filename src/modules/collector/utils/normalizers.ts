/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Normalize noisy profile/resume text into a plain-text paragraph suitable
 * for dedupe + length gating + downstream dataset building.
 *
 * - decodes HTML entities & common mojibake
 * - strips HTML/Markdown/code fences/badges
 * - inlines alt/text from images/links
 * - removes URLs/emails/usernames
 * - collapses whitespace & bullets
 * - prunes noisy GitHub sections (Stats/Trophies)
 */

import he from "he";

/** Main normalizer */
export function normalizeResumeText(input: string): string {
  if (!input) return "";
  let s = String(input);

  // Decode HTML entities and some mojibake-like sequences
  s = he.decode(s);

  // Normalize newlines
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove fenced & inline code
  s = s.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");

  // Inline Markdown images/links: ![alt](url) -> alt, [text](url) -> text
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Extract useful bits from HTML, then strip remaining tags
  s = s.replace(/<img\b[^>]*alt=["']([^"']+)["'][^>]*>/gi, "$1");   // keep alt
  s = s.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1");                    // keep link text
  s = s.replace(/<\/?[^>]+>/g, " ");                                // drop other tags

  // Remove badges/shields and common noise
  s = s.replace(/https?:\/\/img\.shields\.io\/\S+/gi, " ");
  // Prune noisy GitHub sections that often bloat READMEs
  s = s.replace(/GitHub\s+(Stats|Trophies)[\s\S]*$/i, " ");

  // Remove generic URLs/emails/usernames
  s = s.replace(/\bhttps?:\/\/\S+/gi, " ");
  s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ");
  s = s.replace(/@[a-z0-9_]{2,}/gi, " ");

  // Replace bullets/headings with simple separators
  s = s.replace(/^\s*[-*+]\s+/gm, "• ");
  s = s.replace(/^\s*#{1,6}\s+/gm, " ");

  // Strip control chars & NULs
  s = s.replace(/[\u0000-\u001F\u007F]/g, " ");

  // Collapse whitespace/newlines
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n{2,}/g, "\n").replace(/[ \t]*\n[ \t]*/g, "\n");
  s = s.replace(/ {2,}/g, " ");

  // Final trim
  s = s.trim();

  return s;
}

export default normalizeResumeText;
