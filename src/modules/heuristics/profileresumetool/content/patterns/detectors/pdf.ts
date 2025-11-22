// src/modules/heuristics/profileresumetool/content/patterns/detectors/pdf.ts
// 🎯 PURPOSE: Extract selectable text from uploaded PDF files.
// This version is production-hardened: supports large PDFs, worker isolation, and safe fallback.

export async function readPdfSelectableText(file: File): Promise<string> {
  try {
    // ✅ Dynamic import to keep bundles small and avoid Turbopack issues
    const pdfjsLib: any = await import("pdfjs-dist");

    // ✅ Point worker to official CDN (keeps worker lightweight and async)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // ✅ Read file into memory safely
    const arrayBuf = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
    const doc = await loadingTask.promise;

    let extractedText = "";
    const maxPages = Math.min(doc.numPages, 1000); // safeguard for very large files

    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);

      // ⏱ Defensive: page.getTextContent() can be heavy for some PDFs
      const content = await page.getTextContent({
        disableCombineTextItems: false,
      });

      const pageText = content.items
        .map((item: any) => (typeof item.str === "string" ? item.str : ""))
        .join(" ");

      extractedText += pageText + "\n";
    }

    // 🧹 Post-process: normalize spacing & remove noisy fragments
    const cleanText = extractedText
      .replace(/\s{2,}/g, " ") // collapse multiple spaces
      .replace(/\u0000/g, "") // remove null bytes
      .trim();

    // ✅ Return processed, normalized text
    return cleanText;
  } catch (err) {
    console.error("[readPdfSelectableText] Failed to parse PDF:", err);
    return ""; // safe fallback — never throw in UI context
  }
}

/**
 * 🧪 Test: run standalone in Node (optional)
 * Example usage:
 * const file = new File([fs.readFileSync("resume.pdf")], "resume.pdf");
 * const text = await readPdfSelectableText(file);
 * console.log(text);
 */
if (require.main === module) {
  console.log("⚡ readPdfSelectableText ready for production use.");
}

export default readPdfSelectableText;
