// src/data/generation/renderer/textRenderer.ts
// Renders normalized or synthetic resume JSON into ATS-friendly text.

function formatDate(ym?: string) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  if (m) {
    const mm = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${mm[Number(m) - 1] ?? ""} ${y}`;
  }
  return y;
}

export function renderText(res: any): string {
  const name = res.name ?? makeAnonName(res.id);
  const email = res.email ?? "hidden@example.com";
  const lines: string[] = [];

  /* ---------------- HEADER ---------------- */
  lines.push(`CANDIDATE: ${name}`);
  lines.push(`EMAIL: ${email}`);
  lines.push("");

  /* ---------------- SUMMARY ---------------- */
  if (res.summary) {
    lines.push("Career Summary");
    lines.push(res.summary.trim());
    lines.push("");
  }

  /* ---------------- EXPERIENCE ---------------- */
  lines.push("Professional Experience");

  // Support either `roles` array OR single flat fields from synthetic data
  if (Array.isArray(res.roles) && res.roles.length > 0) {
    for (const role of res.roles) {
      const companyLine = `${role.company ?? "N/A"} — ${role.title ?? "N/A"} — ${role.location ?? ""}`.trim();
      const start = formatDate(role.start);
      const end = role.end ? formatDate(role.end) : "Present";
      lines.push(companyLine);
      lines.push(`${start} – ${end}`);
      for (const b of role.bullets ?? []) lines.push(`• ${b.text ?? b}`);
      lines.push("");
    }
  } else {
    // Handle flat synthetic format
    const companyLine = `${res.company ?? "N/A"} — ${res.role ?? "N/A"}`.trim();
    lines.push(companyLine);
    lines.push(`${res.duration ?? "N/A"}`);
    for (const b of res.achievements ?? []) lines.push(`• ${b}`);
    lines.push("");
  }

  /* ---------------- EDUCATION ---------------- */
  lines.push("Education");
  if (Array.isArray(res.education)) {
    for (const e of res.education) {
      const deg = [e.degree, e.discipline].filter(Boolean).join(" — ");
      lines.push(`${deg} — ${e.school ?? ""} — ${e.year ?? ""}`.trim());
    }
  } else if (res.education || res.education === "") {
    lines.push(`— ${res.education || "N/A"} —`);
  } else {
    lines.push("— N/A —");
  }
  lines.push("");

  /* ---------------- CERTIFICATIONS ---------------- */
  if (res.certifications?.length) {
    lines.push("Certifications");
    for (const c of res.certifications) lines.push(`• ${c}`);
    lines.push("");
  }

  /* ---------------- EXTRA / ACHIEVEMENTS ---------------- */
  if (res.extracurriculars?.length) {
    lines.push("Extra-Curricular");
    for (const ex of res.extracurriculars) lines.push(`• ${ex.text ?? ex}`);
    lines.push("");
  }

  /* ---------------- KEYWORDS ---------------- */
  lines.push("Keywords / Signals (for parsing)");
  const kws: string[] = [];

  // flatten both normalized + synthetic signal sources
  const sig = res.signals ?? {};
  for (const [k, v] of Object.entries(sig)) kws.push(`${k}: ${String(v)}`);

  if (res.role) kws.push(`role: ${res.role}`);
  if (res.company) kws.push(`company: ${res.company}`);
  if (res.location) kws.push(`location: ${res.location}`);
  if (res.education && typeof res.education === "string") kws.push(`education: ${res.education}`);

  lines.push(kws.join(" | "));
  lines.push("");

  return lines.join("\n");
}

function makeAnonName(id: string) {
  return `Candidate_${id?.slice(-6) ?? Math.random().toString(36).slice(2, 8)}`;
}

export default { renderText, formatDate };
