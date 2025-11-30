// src/lib/mba/pdf/generateReportPdf.ts
import PDFDocument from "pdfkit";

const SCORE_LABELS: Record<string, string> = {
  academics: "Academics",
  test_readiness: "Test Readiness",
  leadership: "Leadership",
  extracurriculars: "Extracurriculars",
  international: "International Exposure",
  work_impact: "Work Impact",
  impact: "Overall Impact",
  industry: "Industry Exposure",
};

const SCORE_KEYS = Object.keys(SCORE_LABELS);

function normalizeScoreTo100(v: any): number {
  if (v == null || Number.isNaN(Number(v))) return 0;
  const n = Number(v);
  if (n <= 10) return Math.round(Math.max(0, Math.min(10, n)) * 10);
  return Math.round(Math.max(0, Math.min(100, n)));
}

export async function generateReportPdf(report: any): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk as Buffer);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", (err) => {
      reject(err);
    });

    // ------------------------------------------------------------------
    // Extract data from report
    // ------------------------------------------------------------------
    const scores = (report?.scores || {}) as Record<string, number>;
    const strengths = Array.isArray(report?.strengths) ? report.strengths : [];
    const improvements = Array.isArray(report?.improvements) ? report.improvements : [];
    const recommendations = Array.isArray(report?.recommendations) ? report.recommendations : [];
    const generatedAt = report?.generated_at || new Date().toISOString();
    const pipelineVersion = report?.pipeline_version || "unknown";

    // ------------------------------------------------------------------
    // HEADER
    // ------------------------------------------------------------------
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("MBA Profile Evaluation Report", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated at: ${generatedAt}`, { align: "center" })
      .text(`Pipeline version: ${pipelineVersion}`, { align: "center" })
      .moveDown(1.5);

    // ------------------------------------------------------------------
    // SECTION 1: SCORE SUMMARY
    // ------------------------------------------------------------------
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("1. Score Summary", { underline: true })
      .moveDown(0.75);

    doc.fontSize(11).font("Helvetica");

    SCORE_KEYS.forEach((key) => {
      const label = SCORE_LABELS[key] ?? key;
      const normalized = normalizeScoreTo100(scores[key]);

      doc
        .font("Helvetica-Bold")
        .text(label + ":", { continued: true })
        .font("Helvetica")
        .text(` ${normalized}/100`)
        .moveDown(0.15);
    });

    const validValues = SCORE_KEYS.map((k) => normalizeScoreTo100(scores[k]));
    if (validValues.length > 0) {
      const avg =
        validValues.reduce((sum, v) => sum + v, 0) /
        Math.max(validValues.length, 1);

      doc.moveDown(0.5);
      doc
        .font("Helvetica-Bold")
        .text("Overall Average:", { continued: true })
        .font("Helvetica")
        .text(` ${Math.round(avg)}/100`)
        .moveDown(1);
    } else {
      doc.moveDown(1);
    }

    // ------------------------------------------------------------------
    // SECTION 2: Key Strengths
    // ------------------------------------------------------------------
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("2. Key Strengths", { underline: true })
      .moveDown(0.5);

    if (strengths.length === 0) {
      // 🔥 Use italic font instead of italic: true
      doc
        .fontSize(11)
        .font("Helvetica-Oblique")
        .text("No strengths were extracted by the model.")
        .moveDown(1);
      doc.font("Helvetica");
    } else {
      doc.fontSize(11).font("Helvetica");
      strengths.slice(0, 6).forEach((s: any, idx: number) => {
        const title = s?.title || `Strength ${idx + 1}`;
        const summary = s?.summary || s?.summary_text || "";
        const score = typeof s?.score === "number" ? s.score : null;

        doc
          .font("Helvetica-Bold")
          .text(`• ${title}${score != null ? ` (${Math.round(score)}/100)` : ""}`);
        if (summary) {
          doc
            .font("Helvetica")
            .text(summary, { indent: 15, lineGap: 1.5 })
            .moveDown(0.5);
        } else {
          doc.moveDown(0.25);
        }
      });
      doc.moveDown(0.5);
    }

    // ------------------------------------------------------------------
    // SECTION 3: Improvement Areas
    // ------------------------------------------------------------------
    doc
      .addPage()
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("3. Improvement Areas", { underline: true })
      .moveDown(0.5);

    if (improvements.length === 0) {
      doc
        .fontSize(11)
        .font("Helvetica-Oblique")
        .text("No improvement areas were identified by the model.")
        .moveDown(1);
      doc.font("Helvetica");
    } else {
      doc.fontSize(11).font("Helvetica");
      improvements.slice(0, 8).forEach((imp: any, idx: number) => {
        const area = imp?.area || `Area ${idx + 1}`;
        let score = imp?.score;
        if (typeof score === "number") {
          score = score > 10 ? Math.round(score) : Math.round(score * 10);
        } else {
          score = null;
        }
        const suggestion =
          imp?.suggestion ||
          imp?.recommendation ||
          "Consider strengthening this area.";

        doc
          .font("Helvetica-Bold")
          .text(`• ${area}${score != null ? ` (${score}/100)` : ""}`);
        if (suggestion) {
          doc
            .font("Helvetica")
            .text(suggestion, { indent: 15, lineGap: 1.5 })
            .moveDown(0.5);
        } else {
          doc.moveDown(0.25);
        }
      });
      doc.moveDown(0.5);
    }

    // ------------------------------------------------------------------
    // SECTION 4: Actionable Recommendations
    // ------------------------------------------------------------------
    doc
      .addPage()
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("4. Actionable Recommendations", { underline: true })
      .moveDown(0.5);

    if (recommendations.length === 0) {
      doc
        .fontSize(11)
        .font("Helvetica-Oblique")
        .text("No recommendations were generated by the model.")
        .moveDown(1);
      doc.font("Helvetica");
    } else {
      doc.fontSize(11).font("Helvetica");
      recommendations.slice(0, 8).forEach((rec: any, idx: number) => {
        const area = rec?.area || rec?.title || `Recommendation ${idx + 1}`;
        const priority = rec?.priority || "medium";
        let score = rec?.score;
        if (typeof score === "number") {
          score = score > 10 ? Math.round(score) : Math.round(score * 10);
        } else {
          score = null;
        }
        const action = rec?.action || rec?.recommendation || rec?.suggestion || "";
        const impact = rec?.estimated_impact || rec?.impact || "";

        const headerParts = [
          area,
          `(priority: ${priority})`,
          score != null ? `(${score}/100)` : "",
        ].filter(Boolean);

        doc
          .font("Helvetica-Bold")
          .text(`• ${headerParts.join(" ")}`);

        if (action) {
          doc
            .font("Helvetica")
            .text(`Action: ${action}`, { indent: 15, lineGap: 1.5 });
        }
        if (impact) {
          doc
            .font("Helvetica-Oblique")
            .text(`Impact: ${impact}`, { indent: 15, lineGap: 1.5 });
          doc.font("Helvetica");
        }

        doc.moveDown(0.75);
      });
    }

    // ------------------------------------------------------------------
    // SECTION 5: Original Resume (optional, truncated)
    // ------------------------------------------------------------------
    const resumeText: string =
      report?.original_resume ||
      report?.raw_resume_text ||
      report?.resume_text ||
      "";

    if (resumeText && resumeText.trim().length > 0) {
      doc
        .addPage()
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("5. Original Resume (Excerpt)", { underline: true })
        .moveDown(0.5);

      const snippet =
        resumeText.length > 4000
          ? resumeText.slice(0, 4000) + "\n\n[Truncated for PDF]"
          : resumeText;

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(snippet, {
          align: "left",
          lineGap: 1.2,
        });
    }

    doc.end();
  });
}
