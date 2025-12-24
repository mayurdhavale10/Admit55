"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import TechClassicTemplate, { type TechClassicTemplateProps } from "./TechClassicTemplate";

export type TechClassicPreviewProps = {
  data?: TechClassicTemplateProps;
};

const PAGE_W = 794; // A4 width approx at 96dpi
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function clean(v: unknown) {
  return (v ?? "").toString().trim();
}

function pickNonEmpty(primary: unknown, fallback: unknown) {
  const p = clean(primary);
  return p ? p : clean(fallback);
}

export default function TechClassicPreview({ data }: TechClassicPreviewProps) {
  const sample = useMemo<TechClassicTemplateProps>(() => {
    return {
      header: {
        name: "Rahul Gupta",
        title: "Senior Software Engineer",
        phone: "+91 8126621231",
        email: "guptarahul0319@gmail.com",
        linkedin: "your linkedin",
        github: "your github",
        portfolio: "",
        location: "Bengaluru, India",
      },
      summary:
        "Experienced Java backend developer with 6+ years of expertise in designing and developing scalable, high-performance applications. Proficient in microservices, RESTful APIs, and database management, with strong problem-solving skills and a collaborative approach to delivering quality software solutions.",
      skills: {
        heading: "Skills",
        subHeading: "Name of Article",
        rows: [
          { label: "Languages & Frameworks", value: "Java (Core, EE, Spring Boot, Dropwizard), JPA, REST" },
          {
            label: "Cloud & DevOps",
            value: "AWS (Lambda, SNS), GCP, Kubernetes, Docker, Jenkins, Serverless, GitHub, Gradle, Maven",
          },
          {
            label: "Databases",
            value: "PostgreSQL, SQL, NoSQL (MongoDB, Cassandra, HBase, Redis, Elasticsearch)",
          },
          { label: "Messaging", value: "Kafka, RabbitMQ" },
          { label: "Frontend", value: "HTML, CSS" },
        ],
      },
      experiences: [
        {
          company: "WrkSpot",
          location: "Bengaluru, India",
          role: "Senior Software Engineer",
          dateRange: "06/2023 – Present",
          summaryLine: "A software company providing innovative solutions in the hospitality sector",
          bullets: [
            "Designed and built an online timesheet management system with 10 microservices and IoT integration, enabling hoteliers to manage employee timesheets and minimize labor leakage by 30%.",
            "Led a complex integration of 4 microservices with vendor PMS APIs, creating a unified housekeeping system that reduced maintenance time by 30%, saving clients $10M in labor costs.",
            "Engineered comprehensive framework tailored for Quarkus-based applications, reducing development time by 50%.",
            "Achieved API response time in the 99th percentile (P99) under 50ms for an online tipping solution.",
          ],
        },
        {
          company: "Meesho",
          location: "Bengaluru, India",
          role: "Software Development Engineer 2",
          dateRange: "04/2022 – 05/2023",
          summaryLine: "An Indian social commerce platform enabling businesses to reach customers online",
          bullets: [
            "Constructed offer project comprising 12 microservices within 90 days, achieving peak RPS of 68.2k with response time less than 100ms.",
            "Engineered microservices capable of processing 1M RPS, enabling a 1% surge in daily orders.",
            "Facilitated onboarding of 2 experienced developers and mentored 2 college graduates.",
          ],
        },
      ],
      education: [
        {
          institute: "DIT University",
          location: "Dehradun",
          degreeLine: "Bachelor of Technology: Computer Science Engineering",
          dateRange: "07/2014 – 05/2018",
        },
      ],
      achievements: [
        {
          icon: "pin",
          title: "Employee of the Month – WrkSpot",
          description: "Recognized as Employee of the Month for September 2023 at WrkSpot",
        },
        {
          icon: "star",
          title: "Best Team of the Quarter – Meesho",
          description: "Won best team of the quarter award at Meesho amongst 15 teams",
        },
      ],
    };
  }, []);

  // ✅ FIXED: Check for REAL content, not just array existence
  const payload = useMemo<TechClassicTemplateProps>(() => {
    const d = data;

    if (!d) return sample;

    // ✅ Check if experiences have actual content
    const hasRealExperiences = (d.experiences ?? []).some(
      (e: any) => clean(e.company) || clean(e.role)
    );

    // ✅ Check if education has actual content
    const hasRealEducation = (d.education ?? []).some(
      (e: any) => clean(e.institute) || clean(e.degree) || clean(e.degreeLine)
    );

    // ✅ Check if achievements have actual content
    const hasRealAchievements = (d.achievements ?? []).some(
      (a: any) => clean(a.title)
    );

    // ✅ Check if skills have actual content
    const hasRealSkills = (d.skills?.rows ?? []).some(
      (r: any) => clean(r.label) || clean(r.value)
    );

    const hasReal =
      !!clean(d.header?.name) ||
      !!clean(d.summary) ||
      hasRealSkills ||
      hasRealExperiences ||
      hasRealEducation ||
      hasRealAchievements;

    if (!hasReal) return sample;

    // ✅ Merge header FIELD-BY-FIELD (empty strings shouldn't override sample)
    const mergedHeader = {
      name: pickNonEmpty(d.header?.name, sample.header.name),
      title: pickNonEmpty(d.header?.title, sample.header.title),
      phone: pickNonEmpty(d.header?.phone, sample.header.phone),
      email: pickNonEmpty(d.header?.email, sample.header.email),

      // Support both: header.linkedin or header.links.linkedin (if someone used old format)
      linkedin: pickNonEmpty(
        (d.header as any)?.linkedin ?? (d.header as any)?.links?.linkedin,
        (sample.header as any)?.linkedin
      ),
      github: pickNonEmpty(
        (d.header as any)?.github ?? (d.header as any)?.links?.github,
        (sample.header as any)?.github
      ),
      portfolio: pickNonEmpty(
        (d.header as any)?.portfolio ?? (d.header as any)?.links?.portfolio,
        (sample.header as any)?.portfolio
      ),

      location: pickNonEmpty(d.header?.location, sample.header.location),
    };

    // ✅ Skills merge (keep rows safe)
    const mergedSkills = {
      ...(sample.skills ?? {}),
      ...(d.skills ?? {}),
      heading: pickNonEmpty(d.skills?.heading, sample.skills?.heading),
      subHeading: pickNonEmpty(d.skills?.subHeading, sample.skills?.subHeading),
      rows: hasRealSkills ? d.skills!.rows : sample.skills?.rows ?? [],
    };

    const merged: TechClassicTemplateProps = {
      ...sample,
      ...d,
      header: mergedHeader as any,
      skills: mergedSkills as any,
      experiences: hasRealExperiences ? d.experiences : sample.experiences,
      education: hasRealEducation ? d.education : sample.education,
      achievements: hasRealAchievements ? d.achievements : sample.achievements,
      summary: clean(d.summary) ? d.summary : sample.summary,
    };

    return merged;
  }, [data, sample]);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.72);
  const [scaledH, setScaledH] = useState<number>(700);

  // scale based on container width
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const computeScale = () => {
      const w = el.clientWidth;
      const s = clamp((w / PAGE_W) * 0.98, 0.2, 1);
      setScale(s);
    };

    computeScale();
    const ro = new ResizeObserver(() => computeScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // compute height based on actual rendered content
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const measure = () => setScaledH(sheet.scrollHeight * scale);

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [scale, payload]);

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden"
        style={{
          height: Math.ceil(scaledH) + 24,
        }}
      >
        <div className="w-full flex justify-center items-start p-2">
          <div className="origin-top" style={{ transform: `scale(${scale})`, width: PAGE_W }}>
            <div ref={sheetRef}>
              <TechClassicTemplate {...payload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}