import React, { useState } from "react";

type DownloadButtonsProps = {
  resumeData: {
    generated_resume?: {
      header: any;
      summary?: string;
      sections: any[];
    };
    raw_markdown?: string;
  } | null;
  candidateName?: string;
};

/**
 * DownloadButtons
 * ---------------
 * Provides download options for the generated resume:
 * - Download as TXT (plain text)
 * - Download as PDF (client-side generation using basic formatting)
 * - Copy to Clipboard
 */
export default function DownloadButtons({
  resumeData,
  candidateName = "Resume",
}: DownloadButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"txt" | "pdf" | null>(null);

  if (!resumeData?.generated_resume) {
    return null;
  }

  const { header, summary, sections } = resumeData.generated_resume;

  /**
   * Generate plain text version of the resume
   */
  const generatePlainText = (): string => {
    let text = "";

    // Header
    text += `${header.full_name || ""}
`;
    if (header.title) {
      text += `${header.title}
`;
    }
    text += `
`;

    // Contact info
    const contactParts: string[] = [];
    if (header.email) contactParts.push(`Email: ${header.email}`);
    if (header.phone) contactParts.push(`Phone: ${header.phone}`);
    if (header.location) contactParts.push(`Location: ${header.location}`);
    if (header.linkedin) contactParts.push(`LinkedIn: ${header.linkedin}`);
    if (contactParts.length > 0) {
      text += contactParts.join(" | ");
      text += `

`;
    }

    // Summary
    if (summary) {
      text += `PROFESSIONAL SUMMARY
`;
      text += `${"=".repeat(50)}
`;
      text += `${summary}

`;
    }

    // Sections
    sections.forEach((section) => {
      text += `${section.title.toUpperCase()}
`;
      text += `${"=".repeat(50)}
`;

      section.entries?.forEach((entry: any) => {
        if (entry.title) {
          text += `
${entry.title}`;
        }
        if (entry.subtitle) {
          text += ` | ${entry.subtitle}`;
        }
        text += `
`;

        if (entry.start_date || entry.end_date || entry.location) {
          const dateParts: string[] = [];
          if (entry.start_date) dateParts.push(entry.start_date);
          if (entry.end_date) dateParts.push(entry.end_date);
          const dateStr = dateParts.join(" – ");
          if (dateStr) text += `${dateStr}`;
          if (entry.location) {
            text += dateStr ? ` | ${entry.location}` : entry.location;
          }
          text += `
`;
        }

        if (entry.bullets && entry.bullets.length > 0) {
          entry.bullets.forEach((bullet: string) => {
            text += `  • ${bullet}
`;
          });
        }

        text += `
`;
      });

      text += `
`;
    });

    return text;
  };

  /**
   * Download as TXT file
   */
  const downloadTxt = () => {
    setDownloading("txt");
    try {
      const text = generatePlainText();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidateName.replace(/\s+/g, "_")}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading TXT:", error);
    } finally {
      setDownloading(null);
    }
  };

  /**
   * Download as PDF (basic client-side generation)
   * Note: For production, consider using a library like jsPDF or html2pdf
   */
  const downloadPdf = () => {
    setDownloading("pdf");
    try {
      // Create a simple HTML version for PDF conversion
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${header.full_name || "Resume"}</title>
  <style>
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #1e293b;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .title {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 10px;
    }
    .header .contact {
      font-size: 11px;
      color: #64748b;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary {
      font-size: 12px;
      line-height: 1.7;
      color: #334155;
    }
    .entry {
      margin-bottom: 15px;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .entry-title {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .entry-subtitle {
      font-size: 11px;
      color: #475569;
    }
    .entry-meta {
      font-size: 10px;
      color: #64748b;
      text-align: right;
    }
    .bullets {
      margin-top: 5px;
      padding-left: 20px;
    }
    .bullets li {
      font-size: 11px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${header.full_name || ""}</h1>
    ${header.title ? `<div class="title">${header.title}</div>` : ""}
    <div class="contact">
      ${[
        header.email ? `Email: ${header.email}` : "",
        header.phone ? `Phone: ${header.phone}` : "",
        header.location ? `Location: ${header.location}` : "",
        header.linkedin ? `LinkedIn: ${header.linkedin}` : "",
      ]
        .filter(Boolean)
        .join(" | ")}
    </div>
  </div>

  ${
    summary
      ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${summary}</div>
  </div>
  `
      : ""
  }

  ${sections
    .map(
      (section) => `
  <div class="section">
    <div class="section-title">${section.title}</div>
    ${section.entries
      ?.map(
        (entry: any) => `
    <div class="entry">
      <div class="entry-header">
        <div>
          ${entry.title ? `<div class="entry-title">${entry.title}</div>` : ""}
          ${entry.subtitle ? `<div class="entry-subtitle">${entry.subtitle}</div>` : ""}
        </div>
        <div class="entry-meta">
          ${
            entry.start_date || entry.end_date
              ? `<div>${entry.start_date || "—"} ${entry.end_date ? `– ${entry.end_date}` : ""}</div>`
              : ""
          }
          ${entry.location ? `<div>${entry.location}</div>` : ""}
        </div>
      </div>
      ${
        entry.bullets && entry.bullets.length > 0
          ? `
      <ul class="bullets">
        ${entry.bullets.map((bullet: string) => `<li>${bullet}</li>`).join("")}
      </ul>
      `
          : ""
      }
    </div>
    `
      )
      .join("")}
  </div>
  `
    )
    .join("")}
</body>
</html>
      `;

      // Open in new window for printing/saving as PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Trigger print dialog after content loads
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(null);
    }
  };

  /**
   * Copy to clipboard
   */
  const copyToClipboard = async () => {
    try {
      const text = generatePlainText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Download TXT */}
      <button
        onClick={downloadTxt}
        disabled={downloading === "txt"}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {downloading === "txt" ? (
          <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        Download TXT
      </button>

      {/* Download PDF */}
      <button
        onClick={downloadPdf}
        disabled={downloading === "pdf"}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {downloading === "pdf" ? (
          <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )}
        Print / Save PDF
      </button>

      {/* Copy to Clipboard */}
      <button
        onClick={copyToClipboard}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        {copied ? (
          <>
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy to Clipboard
          </>
        )}
      </button>
    </div>
  );
}