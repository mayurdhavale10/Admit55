// src/lib/mba/pdf/generateReportPdf.ts
import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib";
import fs from "fs";
import path from "path";

export interface MbaReportPayload {
  scores?: Record<string, number>;
  strengths?: { title?: string; summary?: string; score?: number }[];
  improvements?: { area?: string; suggestion?: string; score?: number }[];
  recommendations?: {
    id?: string;
    area?: string;
    action?: string;
    priority?: string;
    estimated_impact?: string;
    current_score?: number;
    timeframe?: string;
  }[];
  adcom_panel?: {
    what_excites?: string[];
    what_concerns?: string[];
    how_to_preempt?: string[];
  };
  header_summary?: {
    summary?: string;
    highlights?: string[];
    applicantArchetypeTitle?: string;
    applicantArchetypeSubtitle?: string;
  };
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

function sanitizeTextForPdf(text: string): string {
  return String(text || "").replace(/[^\x00-\x7F]/g, (char) => {
    const map: Record<string, string> = {
      "\u2192": "->",
      "\u2713": "v",
      "\u2709": "email",
      "\u2913": "download",
      "\u21BA": "reload",
      "\u2022": "-",
      "\u2026": "...",
      "\u2014": "-",
      "\u2013": "-",
      "\u201C": '"',
      "\u201D": '"',
      "\u2018": "'",
      "\u2019": "'",
      "\u00D7": "x",
      "\u00F7": "/",
      "\u2728": "*",
    };
    return map[char] || "";
  });
}

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
}): number {
  const { page, x, maxWidth, lineHeight, font, size } = options;
  let { y } = options;
  const color: RGB = options.color ?? rgb(0, 0, 0);

  const sanitizedText = sanitizeTextForPdf(options.text);
  const paragraphs = sanitizedText.split(/\n+/g);

  const drawLine = (l: string) => {
    if (!l.trim()) return;
    page.drawText(l, { x, y, size, font, color });
    y -= lineHeight;
  };

  for (const para of paragraphs) {
    const words = para.split(" ");
    let line = "";

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
    if (line) drawLine(line);

    // paragraph spacing
    y -= Math.max(0, lineHeight * 0.25);
  }

  return y;
}

function wrapLines(text: string, font: any, size: number, maxWidth: number): string[] {
  const sanitizedText = sanitizeTextForPdf(text);
  const paragraphs = sanitizedText.split(/\n+/g);
  const all: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (line) all.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) all.push(line);
    all.push(""); // paragraph break marker (empty line)
  }

  // trim trailing empty markers
  while (all.length && all[all.length - 1] === "") all.pop();
  return all;
}

export async function generateReportPdf(report: MbaReportPayload): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();

  const titleSize = 24;
  const subtitleSize = 14;
  const bodySize = 10;
  const smallSize = 9;

  const marginX = 50;
  const topMargin = 50;
  const bottomMargin = 60;

  let cursorY = height - topMargin;

  const newPage = () => {
    page = pdfDoc.addPage();
    const size = page.getSize();
    width = size.width;
    height = size.height;
    cursorY = height - topMargin;
  };

  const checkSpace = (needed: number) => {
    if (cursorY < bottomMargin + needed) newPage();
  };

  // Color Palette
  const colors = {
    primary: rgb(0.0, 0.35, 0.6),
    emerald: rgb(0.0, 0.7, 0.4),
    emeraldLight: rgb(0.9, 0.98, 0.95),
    red: rgb(0.8, 0.1, 0.1),
    redLight: rgb(0.99, 0.95, 0.95),
    amber: rgb(0.92, 0.6, 0.0),
    amberLight: rgb(0.99, 0.97, 0.9),
    slate: rgb(0.15, 0.15, 0.2),
    slateLight: rgb(0.95, 0.96, 0.97),
    white: rgb(1, 1, 1),
  };

  // ---------------------------------------------------------------------------
  // COVER PAGE WITH LOGO
  // ---------------------------------------------------------------------------
  const candidateName = sanitizeTextForPdf(report.candidate_name || report.name || "MBA Applicant");
  const email = sanitizeTextForPdf(report.email || "");

  // ✅ Embed PNG logo (pdf-lib supports PNG/JPG; NOT WebP)
  let logoImage: any = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo", "admit55_final_logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (err) {
    console.error("Failed to embed logo:", err);
  }

  const headerBarHeight = 140;
  const headerBarY = height - headerBarHeight;

  page.drawRectangle({
    x: 0,
    y: headerBarY,
    width,
    height: headerBarHeight,
    color: rgb(0.0, 0.3, 0.55),
  });

  // Draw logo if available (scaled to a fixed height)
  let logoW = 0;
  if (logoImage) {
    const desiredH = 42;
    const scale = desiredH / logoImage.height;
    const dims = logoImage.scale(scale);
    logoW = dims.width;

    page.drawImage(logoImage, {
      x: marginX,
      y: headerBarY + (headerBarHeight - dims.height) / 2,
      width: dims.width,
      height: dims.height,
    });
  }

  const titleX = marginX + (logoW ? logoW + 16 : 0);

  // ✅ Title text updated
  page.drawText("YOUR MBA PROFILE REPORT", {
    x: titleX,
    y: height - 60,
    size: titleSize,
    font: fontBold,
    color: colors.white,
  });

  page.drawText("by Admit55", {
    x: titleX,
    y: height - 82,
    size: 12,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText(`Prepared for: ${candidateName}`, {
    x: marginX,
    y: height - 112,
    size: subtitleSize,
    font: fontRegular,
    color: colors.white,
  });

  if (email) {
    page.drawText(`Email: ${email}`, {
      x: marginX,
      y: height - 132,
      size: bodySize,
      font: fontRegular,
      color: rgb(0.9, 0.9, 0.9),
    });
  }

  cursorY = height - 180;

  // ---------------------------------------------------------------------------
  // EXECUTIVE SUMMARY (✅ FIXED: dynamic box height so no overlap)
  // ---------------------------------------------------------------------------
  const headerSummary = report.header_summary || {};
  const summary = sanitizeTextForPdf(headerSummary.summary || "Your comprehensive MBA profile analysis.");

  const boxPadding = 14;
  const boxTitleSize = 12;
  const boxTitleGap = 18;
  const summaryLineHeight = 12;
  const summaryMaxWidth = width - 2 * marginX;

  const summaryLines = wrapLines(summary, fontRegular, bodySize, summaryMaxWidth);
  const effectiveLineCount =
    summaryLines.filter((l) => l !== "").length + summaryLines.filter((l) => l === "").length * 0.5;

  const boxHeight =
    boxPadding + boxTitleSize + boxTitleGap + Math.ceil(effectiveLineCount) * summaryLineHeight + boxPadding;

  checkSpace(boxHeight + 40);

  const boxTopY = cursorY;
  const boxY = boxTopY - boxHeight;

  page.drawRectangle({
    x: marginX - 10,
    y: boxY,
    width: width - 2 * marginX + 20,
    height: boxHeight,
    color: colors.emeraldLight,
    borderColor: colors.emerald,
    borderWidth: 2,
  });

  page.drawText("EXECUTIVE SUMMARY", {
    x: marginX,
    y: boxTopY - boxPadding - 2,
    size: boxTitleSize,
    font: fontBold,
    color: colors.emerald,
  });

  let textY = boxTopY - boxPadding - 2 - boxTitleGap;
  for (const ln of summaryLines) {
    if (ln === "") {
      textY -= Math.round(summaryLineHeight * 0.5);
      continue;
    }
    page.drawText(ln, {
      x: marginX,
      y: textY,
      size: bodySize,
      font: fontRegular,
      color: colors.slate,
    });
    textY -= summaryLineHeight;
  }

  cursorY = boxY - 30;

  const generated = report.downloaded_at ? new Date(report.downloaded_at) : new Date();
  page.drawText(`Generated: ${generated.toLocaleDateString()} at ${generated.toLocaleTimeString()}`, {
    x: marginX,
    y: cursorY,
    size: smallSize,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  cursorY -= 60;

  // ---------------------------------------------------------------------------
  // SCORE DASHBOARD
  // ---------------------------------------------------------------------------
  newPage();

  page.drawRectangle({
    x: 0,
    y: cursorY + 10,
    width,
    height: 40,
    color: colors.slateLight,
  });

  page.drawText("PROFILE STRENGTH ANALYSIS", {
    x: marginX,
    y: cursorY,
    size: 18,
    font: fontBold,
    color: colors.slate,
  });

  cursorY -= 50;

  const scores = report.scores || {};
  const scoreEntries = Object.entries(scores);

  if (scoreEntries.length > 0) {
    const avgScore = Math.round(
      scoreEntries.reduce((sum, [, v]) => sum + normalizeScoreTo100(v), 0) / scoreEntries.length
    );

    checkSpace(80);
    page.drawRectangle({
      x: marginX,
      y: cursorY - 50,
      width: 150,
      height: 60,
      color: colors.emeraldLight,
      borderColor: colors.emerald,
      borderWidth: 2,
    });

    page.drawText("OVERALL SCORE", {
      x: marginX + 10,
      y: cursorY - 20,
      size: 9,
      font: fontBold,
      color: colors.emerald,
    });

    page.drawText(`${avgScore}/100`, {
      x: marginX + 10,
      y: cursorY - 42,
      size: 22,
      font: fontBold,
      color: colors.emerald,
    });

    cursorY -= 70;

    const colWidth = 250;
    const rowHeight = 35;

    for (let i = 0; i < scoreEntries.length; i++) {
      const [key, raw] = scoreEntries[i];
      const label = sanitizeTextForPdf(key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      const score = normalizeScoreTo100(raw);

      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = marginX + col * colWidth;
      const y = cursorY - row * rowHeight;

      checkSpace(rowHeight + 20);

      page.drawText(label, {
        x,
        y,
        size: bodySize,
        font: fontBold,
        color: colors.slate,
      });

      page.drawText(`${score}`, {
        x: x + 140,
        y,
        size: bodySize,
        font: fontBold,
        color: score >= 70 ? colors.emerald : colors.amber,
      });

      page.drawRectangle({
        x,
        y: y - 15,
        width: 180,
        height: 6,
        color: colors.slateLight,
      });

      page.drawRectangle({
        x,
        y: y - 15,
        width: (180 * score) / 100,
        height: 6,
        color: score >= 70 ? colors.emerald : colors.amber,
      });
    }

    cursorY -= Math.ceil(scoreEntries.length / 2) * rowHeight + 40;

    checkSpace(250);

    page.drawText("Score Distribution Graph", {
      x: marginX,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: colors.slate,
    });

    cursorY -= 30;

    const chartX = marginX;
    const chartY = cursorY - 180;
    const chartWidth = width - 2 * marginX;
    const chartHeight = 150;
    const barSpacing = chartWidth / scoreEntries.length;

    page.drawRectangle({
      x: chartX,
      y: chartY,
      width: chartWidth,
      height: chartHeight,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    for (let i = 0; i <= 4; i++) {
      const y = chartY + (chartHeight * i) / 4;
      page.drawLine({
        start: { x: chartX, y },
        end: { x: chartX + chartWidth, y },
        color: rgb(0.9, 0.9, 0.9),
        thickness: 0.5,
      });

      page.drawText(`${25 * i}`, {
        x: chartX - 25,
        y: y - 5,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    scoreEntries.forEach(([key, raw], i) => {
      const score = normalizeScoreTo100(raw);
      const barWidth = barSpacing * 0.7;
      const barHeight = (chartHeight * score) / 100;
      const x = chartX + barSpacing * i + barSpacing * 0.15;

      page.drawRectangle({
        x,
        y: chartY,
        width: barWidth,
        height: barHeight,
        color: score >= 70 ? colors.emerald : score >= 50 ? colors.amber : colors.red,
      });

      page.drawText(`${score}`, {
        x: x + barWidth / 2 - 8,
        y: chartY + barHeight + 5,
        size: 8,
        font: fontBold,
        color: colors.slate,
      });

      const label = key.replace(/_/g, " ").substring(0, 8);
      page.drawText(label, {
        x,
        y: chartY - 15,
        size: 7,
        font: fontRegular,
        color: colors.slate,
      });
    });

    cursorY = chartY - 30;
  }

  // ---------------------------------------------------------------------------
  // STRENGTHS
  // ---------------------------------------------------------------------------
  const strengths = Array.isArray(report.strengths) ? report.strengths : [];
  if (strengths.length > 0) {
    newPage();

    page.drawRectangle({
      x: 0,
      y: cursorY + 10,
      width,
      height: 40,
      color: colors.emeraldLight,
    });

    page.drawText("TOP STRENGTHS", {
      x: marginX,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: colors.emerald,
    });

    cursorY -= 50;

    strengths.slice(0, 5).forEach((s, i) => {
      checkSpace(80);

      const title = sanitizeTextForPdf(s.title || `Strength ${i + 1}`);
      const summary = sanitizeTextForPdf(s.summary || "");
      const score = typeof s.score === "number" ? normalizeScoreTo100(s.score) : null;

      page.drawRectangle({
        x: marginX - 5,
        y: cursorY - 55,
        width: width - 2 * marginX + 10,
        height: 60,
        color: colors.emeraldLight,
      });

      page.drawRectangle({
        x: marginX - 5,
        y: cursorY - 55,
        width: 4,
        height: 60,
        color: colors.emerald,
      });

      page.drawCircle({
        x: marginX + 15,
        y: cursorY - 15,
        size: 12,
        color: colors.emerald,
      });

      page.drawText(`${i + 1}`, {
        x: marginX + (i < 9 ? 12 : 9),
        y: cursorY - 19,
        size: 10,
        font: fontBold,
        color: colors.white,
      });

      page.drawText(title, {
        x: marginX + 35,
        y: cursorY - 15,
        size: 11,
        font: fontBold,
        color: colors.slate,
      });

      if (score !== null) {
        page.drawText(`${score}/100`, {
          x: width - marginX - 60,
          y: cursorY - 15,
          size: 10,
          font: fontBold,
          color: colors.emerald,
        });
      }

      cursorY = addWrappedText({
        page,
        text: summary,
        x: marginX + 35,
        y: cursorY - 32,
        maxWidth: width - 2 * marginX - 40,
        lineHeight: 11,
        font: fontRegular,
        size: smallSize,
        color: colors.slate,
      });

      cursorY -= 10;
    });
  }

  // ---------------------------------------------------------------------------
  // IMPROVEMENT AREAS
  // ---------------------------------------------------------------------------
  const improvements = Array.isArray(report.improvements) ? report.improvements : [];
  if (improvements.length > 0) {
    newPage();

    page.drawRectangle({
      x: 0,
      y: cursorY + 10,
      width,
      height: 40,
      color: colors.redLight,
    });

    page.drawText("IMPROVEMENT AREAS", {
      x: marginX,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: colors.red,
    });

    cursorY -= 50;

    improvements.slice(0, 5).forEach((imp, i) => {
      checkSpace(80);

      const area = sanitizeTextForPdf(imp.area || `Area ${i + 1}`);
      const suggestion = sanitizeTextForPdf(imp.suggestion || "");
      const score = typeof imp.score === "number" ? normalizeScoreTo100(imp.score) : null;

      page.drawRectangle({
        x: marginX - 5,
        y: cursorY - 55,
        width: width - 2 * marginX + 10,
        height: 60,
        color: colors.redLight,
      });

      page.drawRectangle({
        x: marginX - 5,
        y: cursorY - 55,
        width: 4,
        height: 60,
        color: colors.red,
      });

      page.drawCircle({
        x: marginX + 15,
        y: cursorY - 15,
        size: 12,
        color: colors.red,
      });

      page.drawText(`${i + 1}`, {
        x: marginX + (i < 9 ? 12 : 9),
        y: cursorY - 19,
        size: 10,
        font: fontBold,
        color: colors.white,
      });

      page.drawText(area, {
        x: marginX + 35,
        y: cursorY - 15,
        size: 11,
        font: fontBold,
        color: colors.slate,
      });

      if (score !== null) {
        page.drawText(`${score}/100`, {
          x: width - marginX - 60,
          y: cursorY - 15,
          size: 10,
          font: fontBold,
          color: colors.red,
        });
      }

      cursorY = addWrappedText({
        page,
        text: suggestion,
        x: marginX + 35,
        y: cursorY - 32,
        maxWidth: width - 2 * marginX - 40,
        lineHeight: 11,
        font: fontRegular,
        size: smallSize,
        color: colors.slate,
      });

      cursorY -= 10;
    });
  }

  // ---------------------------------------------------------------------------
  // ADCOM PANEL
  // ---------------------------------------------------------------------------
  const adcom = report.adcom_panel || {};
  const excites = Array.isArray(adcom.what_excites) ? adcom.what_excites : [];
  const concerns = Array.isArray(adcom.what_concerns) ? adcom.what_concerns : [];
  const preempt = Array.isArray(adcom.how_to_preempt) ? adcom.how_to_preempt : [];

  if (excites.length || concerns.length || preempt.length) {
    newPage();

    page.drawRectangle({
      x: 0,
      y: cursorY + 10,
      width,
      height: 40,
      color: colors.amberLight,
    });

    page.drawText("ADCOM PERSPECTIVE", {
      x: marginX,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: colors.amber,
    });

    cursorY -= 50;

    if (excites.length) {
      checkSpace(60);
      page.drawText("What Excites AdCom:", {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: colors.emerald,
      });
      cursorY -= 15;

      excites.slice(0, 3).forEach((item) => {
        cursorY = addWrappedText({
          page,
          text: `- ${sanitizeTextForPdf(item)}`,
          x: marginX + 10,
          y: cursorY,
          maxWidth: width - 2 * marginX - 10,
          lineHeight: 12,
          font: fontRegular,
          size: bodySize,
          color: colors.slate,
        });
        cursorY -= 5;
      });

      cursorY -= 15;
    }

    if (concerns.length) {
      checkSpace(60);
      page.drawText("What Concerns AdCom:", {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: colors.red,
      });
      cursorY -= 15;

      concerns.slice(0, 3).forEach((item) => {
        cursorY = addWrappedText({
          page,
          text: `- ${sanitizeTextForPdf(item)}`,
          x: marginX + 10,
          y: cursorY,
          maxWidth: width - 2 * marginX - 10,
          lineHeight: 12,
          font: fontRegular,
          size: bodySize,
          color: colors.slate,
        });
        cursorY -= 5;
      });

      cursorY -= 15;
    }

    if (preempt.length) {
      checkSpace(60);
      page.drawText("How to Preempt Concerns:", {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: colors.primary,
      });
      cursorY -= 15;

      preempt.slice(0, 3).forEach((item) => {
        cursorY = addWrappedText({
          page,
          text: `- ${sanitizeTextForPdf(item)}`,
          x: marginX + 10,
          y: cursorY,
          maxWidth: width - 2 * marginX - 10,
          lineHeight: 12,
          font: fontRegular,
          size: bodySize,
          color: colors.slate,
        });
        cursorY -= 5;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // ACTION PLAN
  // ---------------------------------------------------------------------------
  const recommendations = Array.isArray(report.recommendations) ? report.recommendations : [];
  if (recommendations.length > 0) {
    newPage();

    page.drawRectangle({
      x: 0,
      y: cursorY + 10,
      width,
      height: 40,
      color: colors.slateLight,
    });

    page.drawText("YOUR ACTION PLAN", {
      x: marginX,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: colors.primary,
    });

    cursorY -= 50;

    const buckets: Record<string, any[]> = {
      "1-3 weeks": [],
      "3-6 weeks": [],
      "3 months": [],
    };

    recommendations.forEach((rec) => {
      const tf = (rec.timeframe || "").toLowerCase();
      if (tf.includes("1-3") || tf.includes("1_3")) buckets["1-3 weeks"].push(rec);
      else if (tf.includes("3-6") || tf.includes("4-6")) buckets["3-6 weeks"].push(rec);
      else buckets["3 months"].push(rec);
    });

    Object.entries(buckets).forEach(([timeframe, items]) => {
      if (items.length === 0) return;

      checkSpace(70);

      page.drawText(`Next ${timeframe}:`, {
        x: marginX,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: colors.primary,
      });
      cursorY -= 18;

      items.slice(0, 3).forEach((rec, i) => {
        checkSpace(60);

        const area = sanitizeTextForPdf(rec.area || "General");
        const action = sanitizeTextForPdf(rec.action || "");
        const priority = (rec.priority || "medium").toUpperCase();

        page.drawText(`${i + 1}. [${priority}] ${area}`, {
          x: marginX + 10,
          y: cursorY,
          size: bodySize,
          font: fontBold,
          color: colors.slate,
        });
        cursorY -= 14;

        if (action) {
          cursorY = addWrappedText({
            page,
            text: action,
            x: marginX + 20,
            y: cursorY,
            maxWidth: width - 2 * marginX - 25,
            lineHeight: 11,
            font: fontRegular,
            size: smallSize,
            color: colors.slate,
          });
          cursorY -= 8;
        }
      });

      cursorY -= 15;
    });
  }

  // ---------------------------------------------------------------------------
  // FOOTER ON ALL PAGES
  // ---------------------------------------------------------------------------
  const pages = pdfDoc.getPages();
  pages.forEach((pg, idx) => {
    const { width: pw } = pg.getSize();

    pg.drawText(`Page ${idx + 1} of ${pages.length}`, {
      x: pw / 2 - 30,
      y: 30,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    pg.drawText("Generated by Admit55", {
      x: pw - 150,
      y: 30,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  return await pdfDoc.save();
}
