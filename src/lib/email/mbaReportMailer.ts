// src/lib/email/mbaReportMailer.ts
import nodemailer from "nodemailer";
import type { MbaReportPayload } from "@src/lib/mba/pdf/generateReportPdf";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Admit55";

// Base URL for public assets (logo, links in email)
const APP_BASE_URL =
  process.env.APP_BASE_URL || "https://admit55.vercel.app";

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "[Mailer] EMAIL_USER or EMAIL_PASS not set. Email sending will fail until env is configured."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// -----------------------------------------------------------------------------
// Helper: Build TEXT body (fallback for clients that don't render HTML)
// -----------------------------------------------------------------------------
function buildTextBody(candidateName: string) {
  return `
Dear ${candidateName},

Thank you for using the Admit55 MBA Profile Evaluation tool.

Your personalised MBA profile report is attached as a PDF. The report includes:
• A structured assessment of your profile across academics, leadership, impact, and global exposure.
• Key strengths that you can highlight in your resume, essays, and interviews.
• Targeted areas where focused improvement can enhance your competitiveness.
• Actionable recommendations to help you prioritise next steps.

Suggested next steps:
1) Review the "Actionable Recommendations" section in the report.
2) Select 2–3 priority areas to focus on over the coming weeks.
3) Update your resume, LinkedIn, and application story using the insights.

If you would like tailored guidance on school selection, profile strategy, or application documents, you can book a 1:1 session with an Admit55 mentor here:
${APP_BASE_URL}/alum-coaches

Best regards,
Team Admit55
${APP_BASE_URL}
`.trim();
}

// -----------------------------------------------------------------------------
// Helper: Build HTML body (McKinsey-style professional tone)
// -----------------------------------------------------------------------------
function buildHtmlBody(candidateName: string) {
  const logoUrl = `${APP_BASE_URL}/logo/admit55_final_logo.webp`;

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif; background:#f5f7fb; padding:24px;">
  <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px 28px; box-shadow:0 10px 30px rgba(15,23,42,0.08);">

    <!-- Header / Logo -->
    <div style="text-align:center; margin-bottom:24px;">
      <img src="${logoUrl}" alt="Admit55" style="height:40px; margin-bottom:8px;" />
      <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#64748b;">
        MBA Profile Evaluation Report
      </div>
    </div>

    <!-- Greeting -->
    <p style="font-size:14px; color:#0f172a; margin:0 0 12px;">
      Dear ${candidateName},
    </p>

    <!-- Intro -->
    <p style="font-size:14px; color:#334155; line-height:1.7; margin:0 0 12px;">
      Thank you for using the <strong>Admit55 MBA Profile Evaluation</strong>. 
      Your personalised report is attached as a PDF.
    </p>

    <p style="font-size:14px; color:#334155; line-height:1.7; margin:0 0 16px;">
      The report is designed to give you a clear, structured view of how your profile currently aligns with
      top global MBA programs.
    </p>

    <!-- What the report includes -->
    <div style="margin:4px 0 18px;">
      <p style="font-size:13px; color:#0f172a; font-weight:600; margin:0 0 6px;">
        Inside the report, you will find:
      </p>
      <ul style="font-size:13px; color:#334155; line-height:1.7; padding-left:18px; margin:0;">
        <li>A quantitative assessment of your profile across academics, test readiness, leadership, professional impact, extracurriculars and international exposure.</li>
        <li>Key strengths you can highlight in your resume, application essays, and interviews.</li>
        <li>Specific areas where targeted improvement can materially strengthen your candidacy.</li>
        <li>Actionable recommendations to help you prioritise next steps in a structured way.</li>
      </ul>
    </div>

    <!-- Suggested next steps box -->
    <div style="margin:20px 0; padding:14px 18px; border-radius:12px; background:#f0f9ff; border:1px solid #bae6fd;">
      <p style="font-size:13px; color:#0369a1; font-weight:600; margin:0 0 6px;">
        Suggested next steps
      </p>
      <ol style="font-size:13px; color:#0c4a6e; line-height:1.7; padding-left:18px; margin:0;">
        <li>Review the <strong>"Actionable Recommendations"</strong> section in the attached report.</li>
        <li>Identify 2–3 focus areas that are most relevant to your short- and long-term goals.</li>
        <li>Update your resume, LinkedIn, and application narrative based on these insights.</li>
      </ol>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center; margin:18px 0 10px;">
      <a href="${APP_BASE_URL}/alum-coaches"
         style="
           display:inline-block;
           background:#0f172a;
           color:#ffffff;
           padding:11px 24px;
           border-radius:999px;
           font-size:13px;
           font-weight:600;
           text-decoration:none;
           letter-spacing:0.02em;
         ">
        Book a 1:1 Consultation with an Admit55 Mentor
      </a>
    </div>

    <p style="font-size:12px; color:#64748b; text-align:center; margin:6px 0 18px; line-height:1.6;">
      Our mentors are alumni and admits from leading global business schools and can help you 
      refine your school list, application strategy, and interview preparation.
    </p>

    <!-- Divider -->
    <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0 14px;" />

    <!-- About / Footer -->
    <p style="font-size:11px; color:#94a3b8; line-height:1.6; text-align:center; margin:0 0 4px;">
      You are receiving this email because you used the Admit55 MBA profile evaluation tool.
    </p>
    <p style="font-size:11px; color:#94a3b8; text-align:center; margin:0;">
      © ${new Date().getFullYear()} Admit55. All rights reserved.
    </p>

  </div>
</div>
`.trim();
}

// -----------------------------------------------------------------------------
// Main mailer function
// -----------------------------------------------------------------------------
export async function sendMbaReportEmail(
  to: string,
  pdfBytes: Uint8Array,
  report: MbaReportPayload
) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email env vars (EMAIL_USER/EMAIL_PASS) not configured");
  }

  const candidateName =
    report.candidate_name || report.name || report.profile_name || "MBA Applicant";

  const from = `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`;

  const textBody = buildTextBody(candidateName);
  const htmlBody = buildHtmlBody(candidateName);

  await transporter.sendMail({
    from,
    to,
    subject: `Your MBA Profile Evaluation Report – ${candidateName}`,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        filename: "mba_profile_report.pdf",
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });
}
