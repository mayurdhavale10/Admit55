// src/lib/mba/pdf/generateReportPdf.ts
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";

export interface MbaReportPayload {
  scores?: Record<string, number>;
  strengths?: { title?: string; summary?: string; score?: number }[];
  improvements?: { area?: string; suggestion?: string; score?: number }[];
  recommendations?: {
    area?: string;
    action?: string;
    priority?: string;
    estimated_impact?: string;
    current_score?: number;
  }[];
  candidate_name?: string;
  email?: string;
  downloaded_at?: string;
  [key: string]: any;
}

function normalizeScoreTo100(v: any): number {
  if (v == null || Number.isNaN(Number(v))) return 0;
  const n = Number(v);
  if (n <= 10) return Math.round(Math.max(0, Math.min(10, n)) * 10);
  return Math.round(Math.max(0, Math.min(100, n)));
}

/**
 * Simple wrapped text helper for one page.
 * Caller is responsible for checking space / adding new pages.
 * Returns updated y position.
 */
function addWrappedText(options: {
  page: any;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  font: any;
  size: number;
  color?: RGB;
}) {
  const { page, text, x, maxWidth, lineHeight, font, size } = options;
  let { y } = options;
  const color: RGB = options.color ?? rgb(0, 0, 0);

  const words = text.split(" ");
  let line = "";

  const drawLine = (l: string) => {
    if (!l.trim()) return;
    page.drawText(l, {
      x,
      y,
      size,
      font,
      color,
    });
    y -= lineHeight;
  };

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth) {
      drawLine(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    drawLine(line);
  }

  return y;
}

export async function generateReportPdf(
  report: MbaReportPayload
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();

  const titleSize = 22;
  const subtitleSize = 12;
  const bodySize = 10;
  const lineHeight = 14;
  const marginX = 50;
  const topMargin = 60;
  const bottomMargin = 60;

  const newPage = () => {
    page = pdfDoc.addPage();
    const size = page.getSize();
    width = size.width;
    height = size.height;
    cursorY = height - topMargin;
  };

  // ---------------------------------------------------------------------------
  // HEADER
  // ---------------------------------------------------------------------------
  const candidateName =
    report.candidate_name ||
    report.name ||
    report.profile_name ||
    "MBA Applicant";
  const email = report.email || report.contact_email || "";

  page.drawText("MBA Profile Report", {
    x: marginX,
    y: height - topMargin,
    size: titleSize,
    font,
    color: rgb(0.1, 0.1, 0.2),
  });

  let cursorY = height - topMargin - 30;

  page.drawText(`Candidate: ${candidateName}`, {
    x: marginX,
    y: cursorY,
    size: subtitleSize,
    font,
  });
  cursorY -= lineHeight;

  if (email) {
    page.drawText(`Email: ${email}`, {
      x: marginX,
      y: cursorY,
      size: subtitleSize,
      font,
    });
    cursorY -= lineHeight;
  }

  const generated = report.downloaded_at
    ? new Date(report.downloaded_at)
    : new Date();

  page.drawText(`Generated on: ${generated.toLocaleString()}`, {
    x: marginX,
    y: cursorY,
    size: bodySize,
    font,
  });
  cursorY -= lineHeight * 2;

  // ---------------------------------------------------------------------------
  // SCORE SUMMARY + MINI BARS
  // ---------------------------------------------------------------------------
  const scores = report.scores || {};
  const scoreEntries = Object.entries(scores) as [string, any][];

  if (cursorY < bottomMargin + 4 * lineHeight) {
    newPage();
  }

  page.drawText("Score Summary (0–100)", {
    x: marginX,
    y: cursorY,
    size: subtitleSize,
    font,
    color: rgb(0.0, 0.35, 0.5),
  });
  cursorY -= lineHeight;

  const leftColX = marginX;
  const rightColX = marginX + 220;
  const barWidth = 130;
  const barHeight = 6;

  const drawScoreRow = (
    x: number,
    y: number,
    label: string,
    score: number
  ) => {
    page.drawText(label, {
      x,
      y,
      size: bodySize,
      font,
    });

    page.drawText(`${score}`, {
      x,
      y: y - lineHeight + 4,
      size: bodySize,
      font,
      color: rgb(0.15, 0.55, 0.3),
    });

    // background bar
    page.drawRectangle({
      x: x + 50,
      y: y - lineHeight + 6,
      width: barWidth,
      height: barHeight,
      color: rgb(0.9, 0.93, 0.96),
    });

    // filled bar
    const w = (barWidth * score) / 100;
    page.drawRectangle({
      x: x + 50,
      y: y - lineHeight + 6,
      width: w,
      height: barHeight,
      color: rgb(0.0, 0.7, 0.55),
    });
  };

  let idx = 0;
  for (const [key, raw] of scoreEntries) {
    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const score = normalizeScoreTo100(raw);

    // Start a new page if we are too low for another row pair
    if (cursorY < bottomMargin + 3 * lineHeight) {
      newPage();
      page.drawText("Score Summary (0–100)", {
        x: marginX,
        y: cursorY,
        size: subtitleSize,
        font,
        color: rgb(0.0, 0.35, 0.5),
      });
      cursorY -= lineHeight;
      idx = 0; // reset pair layout on new page
    }

    const colX = idx % 2 === 0 ? leftColX : rightColX;

    if (idx % 2 === 0 && idx > 0) {
      cursorY -= lineHeight * 2;
    }

    drawScoreRow(colX, cursorY, label, score);

    if (idx % 2 === 1) {
      cursorY -= lineHeight * 2;
    }

    idx++;
  }

  cursorY -= lineHeight * 3;

  // ---------------------------------------------------------------------------
  // STRENGTHS
  // ---------------------------------------------------------------------------
  const strengths = Array.isArray(report.strengths) ? report.strengths : [];
  if (strengths.length > 0) {
    if (cursorY < bottomMargin + 4 * lineHeight) {
      newPage();
    }

    page.drawText("Top Strengths", {
      x: marginX,
      y: cursorY,
      size: subtitleSize,
      font,
      color: rgb(0.0, 0.5, 0.25),
    });
    cursorY -= lineHeight;

    strengths.slice(0, 4).forEach((s, i) => {
      // Make sure we have space for this block
      if (cursorY < bottomMargin + 4 * lineHeight) {
        newPage();
        page.drawText("Top Strengths (cont.)", {
          x: marginX,
          y: cursorY,
          size: subtitleSize,
          font,
          color: rgb(0.0, 0.5, 0.25),
        });
        cursorY -= lineHeight;
      }

      const title = s.title || `Strength ${i + 1}`;
      const scoreText =
        typeof s.score === "number"
          ? ` (${normalizeScoreTo100(s.score)}/100)`
          : "";
      const summary = s.summary || "";

      cursorY = addWrappedText({
        page,
        text: `${i + 1}. ${title}${scoreText}`,
        x: marginX,
        y: cursorY,
        maxWidth: width - marginX * 2,
        lineHeight,
        font,
        size: bodySize,
        color: rgb(0.0, 0.35, 0.2),
      });

      cursorY = addWrappedText({
        page,
        text: summary,
        x: marginX + 12,
        y: cursorY,
        maxWidth: width - marginX * 2 - 12,
        lineHeight,
        font,
        size: bodySize,
        color: rgb(0.1, 0.1, 0.1),
      });

      cursorY -= lineHeight / 2;
    });

    cursorY -= lineHeight;
  }

  // ---------------------------------------------------------------------------
  // IMPROVEMENT AREAS
  // ---------------------------------------------------------------------------
  const improvements = Array.isArray(report.improvements)
    ? report.improvements
    : [];

  if (improvements.length > 0) {
    if (cursorY < bottomMargin + 4 * lineHeight) {
      newPage();
    }

    page.drawText("Improvement Areas", {
      x: marginX,
      y: cursorY,
      size: subtitleSize,
      font,
      color: rgb(0.7, 0.15, 0.15),
    });
    cursorY -= lineHeight;

    improvements.slice(0, 4).forEach((imp, i) => {
      if (cursorY < bottomMargin + 4 * lineHeight) {
        newPage();
        page.drawText("Improvement Areas (cont.)", {
          x: marginX,
          y: cursorY,
          size: subtitleSize,
          font,
          color: rgb(0.7, 0.15, 0.15),
        });
        cursorY -= lineHeight;
      }

      const area = imp.area || `Area ${i + 1}`;
      const scoreText =
        typeof imp.score === "number"
          ? ` (current: ${normalizeScoreTo100(imp.score)}/100)`
          : "";
      const suggestion =
        imp.suggestion || "Consider strengthening this area.";

      cursorY = addWrappedText({
        page,
        text: `${i + 1}. ${area}${scoreText}`,
        x: marginX,
        y: cursorY,
        maxWidth: width - marginX * 2,
        lineHeight,
        font,
        size: bodySize,
        color: rgb(0.5, 0.1, 0.1),
      });

      cursorY = addWrappedText({
        page,
        text: suggestion,
        x: marginX + 12,
        y: cursorY,
        maxWidth: width - marginX * 2 - 12,
        lineHeight,
        font,
        size: bodySize,
        color: rgb(0.1, 0.1, 0.1),
      });

      cursorY -= lineHeight / 2;
    });

    cursorY -= lineHeight;
  }

  // ---------------------------------------------------------------------------
  // ACTIONABLE RECOMMENDATIONS
  // ---------------------------------------------------------------------------
  const recommendations = Array.isArray(report.recommendations)
    ? report.recommendations
    : [];

  if (recommendations.length > 0) {
    if (cursorY < bottomMargin + 4 * lineHeight) {
      newPage();
    }

    page.drawText("Actionable Recommendations", {
      x: marginX,
      y: cursorY,
      size: subtitleSize,
      font,
      color: rgb(0.0, 0.35, 0.6),
    });
    cursorY -= lineHeight;

    recommendations.slice(0, 8).forEach((rec, i) => {
      if (cursorY < bottomMargin + 5 * lineHeight) {
        newPage();
        page.drawText("Actionable Recommendations (cont.)", {
          x: marginX,
          y: cursorY,
          size: subtitleSize,
          font,
          color: rgb(0.0, 0.35, 0.6),
        });
        cursorY -= lineHeight;
      }

      const area = rec.area || "General";
      const priority = (rec.priority || "medium").toUpperCase();
      const action = rec.action || "";
      const impact = rec.estimated_impact || "";

      let header = `${i + 1}. [${priority}] ${area}`;
      cursorY = addWrappedText({
        page,
        text: header,
        x: marginX,
        y: cursorY,
        maxWidth: width - marginX * 2,
        lineHeight,
        font,
        size: bodySize,
        color: rgb(0.0, 0.25, 0.45),
      });

      if (action) {
        cursorY = addWrappedText({
          page,
          text: `Action: ${action}`,
          x: marginX + 12,
          y: cursorY,
          maxWidth: width - marginX * 2 - 12,
          lineHeight,
          font,
          size: bodySize,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      if (impact) {
        cursorY = addWrappedText({
          page,
          text: `Impact: ${impact}`,
          x: marginX + 12,
          y: cursorY,
          maxWidth: width - marginX * 2 - 12,
          lineHeight,
          font,
          size: bodySize,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      cursorY -= lineHeight / 2;
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
