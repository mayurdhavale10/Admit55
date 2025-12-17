// components/resume-templates/TemplateConsultingClassic.tsx

import React from "react";
import { ResumeData } from "../../utils/resumeTypes";

type Props = {
  data: ResumeData;
};

const TemplateConsultingClassic: React.FC<Props> = ({ data }) => {
  const name = `${data.basicInfo?.firstName ?? ""} ${data.basicInfo?.lastName ?? ""}`.trim();
  const headline = data.basicInfo?.headline;
  const email = data.basicInfo?.email;
  const phone = data.basicInfo?.phone;
  const location = data.basicInfo?.location;

  return (
    <div
      className="
        w-full aspect-[210/297]       /* A4 ratio */
        bg-white text-slate-900 
        rounded-xl border border-slate-200 shadow-sm
        p-8 flex flex-col gap-4
      "
    >
      {/* HEADER */}
      <header className="border-b border-slate-200 pb-3">
        <h1 className="text-[20px] font-semibold tracking-wide uppercase">
          {name || "Your Name"}
        </h1>
        {headline && (
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-600">
            {headline}
          </p>
        )}

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
          {email && <span>{email}</span>}
          {phone && <span>• {phone}</span>}
          {location && <span>• {location}</span>}
        </div>
      </header>

      {/* BODY: two-column layout */}
      <div className="flex-1 grid grid-cols-[2fr_1fr] gap-6 text-[10px] leading-relaxed">
        {/* LEFT COLUMN: experience, projects, leadership */}
        <div className="space-y-4">
          {/* EXPERIENCE */}
          {data.experiences && data.experiences.length > 0 && (
            <section>
              <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                Employment History
              </h2>

              <div className="mt-2 space-y-3">
                {data.experiences.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span>{exp.role}</span>
                      <span className="text-slate-500">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{exp.company}</span>
                      <span>{exp.location}</span>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        {exp.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PROJECTS */}
          {data.projects && data.projects.length > 0 && (
            <section className="mt-3">
              <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                Projects
              </h2>
              <div className="mt-2 space-y-2">
                {data.projects.map((p, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] font-semibold">{p.name}</p>
                    {p.bullets && (
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        {p.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LEADERSHIP */}
          {data.leadership && data.leadership.length > 0 && (
            <section className="mt-3">
              <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                Leadership & Activities
              </h2>
              <div className="mt-2 space-y-2">
                {data.leadership.map((l, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] font-semibold">{l.name}</p>
                    {l.bullets && (
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        {l.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: summary, education, skills */}
        <div className="space-y-4">
          {/* SUMMARY */}
          {data.summary && (
            <section>
              <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                Profile
              </h2>
              <p className="mt-2 text-[10px] text-slate-700">{data.summary}</p>
            </section>
          )}

          {/* EDUCATION */}
          {data.education && data.education.length > 0 && (
            <section>
              <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                Education
              </h2>
              <div className="mt-2 space-y-2">
                {data.education.map((ed, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span>{ed.degree}</span>
                      <span className="text-slate-500">
                        {ed.startDate} – {ed.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{ed.school}</span>
                      <span>{ed.location}</span>
                    </div>
                    {ed.details && (
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        {ed.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SKILLS */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="border-b border-slate-300 pb-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                Skills
              </h2>
              <ul className="mt-2 ml-3 list-disc space-y-0.5">
                {data.skills.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateConsultingClassic;
