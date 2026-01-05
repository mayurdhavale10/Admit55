// src/app/BSchools/IIMADubai/components/admissioninfo.tsx
import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";

export default function AdmissionInfo() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">

        {/* SECTION HEADING */}
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-[#0B1B3A]">
          Admissions Timeline – September 2026 Intake
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* LEFT: TIMELINE CARD */}
          <div className="rounded-3xl border-2 border-[#E11D48] bg-[#FFF7F8] p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E11D48]">
                <Calendar className="h-6 w-6 text-white" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#0B1B3A]">
                  Round-1 Deadline
                </h3>
                <p className="mt-1 text-sm text-[#0B1B3A]/70">
                  September 2026 Intake
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-8">

              {/* STEP 1 */}
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE7EA] text-[#E11D48] font-semibold">
                  1
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0B1B3A]">
                    Application Deadline
                  </div>
                  <div className="mt-1 text-lg font-bold text-[#E11D48]">
                    22 February 2026
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="flex items-start gap-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#065F46] font-semibold">
                  2
                </div>
                <div>
                  <div className="text-base font-semibold text-[#0B1B3A]">
                    Programme Start
                  </div>
                  <div className="mt-1 text-lg font-bold text-[#0A7A63]">
                    September 2026
                  </div>
                </div>
              </div>

              {/* NOTE */}
              <div className="rounded-2xl border border-[#F4D58A] bg-[#FFF7DF] p-5 text-[#6B4A00] text-sm leading-relaxed">
                <span className="font-semibold">Note:</span>{" "}
                Early applications are recommended. Interviews are conducted on a
                rolling basis after application submission.
              </div>
            </div>
          </div>

          {/* RIGHT: ELIGIBILITY CARD */}
          <div className="rounded-3xl border border-[#D8E3F3] bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#0B1B3A]">
              Eligibility Criteria
            </h3>

            <p className="mt-4 text-sm text-[#0B1B3A]/70">
              Applicants must meet the following requirements:
            </p>

            <ul className="mt-8 space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#0A7A63]" />
                <p className="text-base text-[#0B1B3A]/85">
                  <span className="font-semibold text-[#0B1B3A]">
                    Bachelor&apos;s degree
                  </span>{" "}
                  or equivalent from a recognized institution
                </p>
              </li>

              <li className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#0A7A63]" />
                <p className="text-base text-[#0B1B3A]/85">
                  <span className="font-semibold text-[#0B1B3A]">
                    Minimum age of 25 years
                  </span>{" "}
                  as of 31 August 2026
                </p>
              </li>

              <li className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#0A7A63]" />
                <p className="text-base text-[#0B1B3A]/85">
                  <span className="font-semibold text-[#0B1B3A]">
                    At least 4 years
                  </span>{" "}
                  of full-time work experience post-graduation
                </p>
              </li>

              <li className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#0A7A63]" />
                <p className="text-base text-[#0B1B3A]/85">
                  <span className="font-semibold text-[#0B1B3A]">
                    Valid GMAT or GRE score
                  </span>{" "}
                  (GMAT Focus Edition accepted; score must be within 5 years)
                </p>
              </li>
            </ul>

            <div className="mt-10 border-t border-[#E6EEF9] pt-8">
              <p className="text-sm text-[#0B1B3A]/70">Official links:</p>

              <div className="mt-4 space-y-3">
                <a
                  href="https://www.iima.ac.in/iima-dubai-campus/academic-dubai/one-year-mba"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[#0A7A63] font-semibold hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Programme details
                </a>

                <br />

                <a
                  href="https://dubai.iima.ac.in/admissions/main.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[#0A7A63] font-semibold hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Application portal
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
