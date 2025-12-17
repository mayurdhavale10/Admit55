// src/app/mba/tools/resumewriter/utils/printCss.ts
export function withResumePrintStyles(runPrint: () => void) {
  const style = document.createElement("style");
  style.setAttribute("data-resume-print", "true");

  style.innerHTML = `
@page { size: A4; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; }
  body * { visibility: hidden !important; }
  #resume-print, #resume-print * { visibility: visible !important; }
  #resume-print {
    position: fixed !important;
    inset: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    overflow: hidden !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;
  document.head.appendChild(style);

  // run print
  runPrint();

  // remove after print
  const cleanup = () => {
    style.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
}
