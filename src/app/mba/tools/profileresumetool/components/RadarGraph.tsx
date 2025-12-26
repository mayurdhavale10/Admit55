"use client";
import { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Scores = Record<string, number>;

interface RadarGraphProps {
  scores: Scores;
}

/**
 * Map internal keys to friendly labels & consistent order.
 */
const ORDERED_KEYS: { key: string; label: string }[] = [
  { key: "Academics", label: "Academics" },
  { key: "Test Readiness", label: "Test Readiness" },
  { key: "Leadership", label: "Leadership" },
  { key: "Extracurriculars", label: "Extracurriculars" },
  { key: "International", label: "International" },
  { key: "Work Impact", label: "Work Impact" },
  { key: "Impact", label: "Impact" },
  { key: "Industry Exposure", label: "Industry" },
];

// Premium tooltip with score-based colors
function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  const score = item.fullScore;
  const colorClass =
    score >= 80
      ? "border-emerald-400 bg-emerald-50"
      : score >= 60
      ? "border-teal-400 bg-teal-50"
      : "border-amber-400 bg-amber-50";

  const textColorClass =
    score >= 80
      ? "text-emerald-900"
      : score >= 60
      ? "text-teal-900"
      : "text-amber-900";

  return (
    <div
      className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg border-2 ${colorClass}`}
    >
      <p className={`font-bold text-xs sm:text-sm ${textColorClass}`}>{item.subject}</p>
      <p className={`text-lg sm:text-xl font-extrabold mt-1 ${textColorClass}`}>
        {item.fullScore} / 100
      </p>
    </div>
  );
}

export default function RadarGraph({ scores = {} }: RadarGraphProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Build chart data - using 0-100 scale directly
  const data = ORDERED_KEYS.map(({ key, label }) => {
    const raw = scores[key] ?? scores[label] ?? 0;
    const fullScore = raw > 10 ? Math.max(0, Math.min(100, raw)) : raw * 10; // clamp & scale to 100
    return {
      subject: label,
      value: mounted ? fullScore : 0, // Use full 0-100 score
      fullScore: Math.round(fullScore),
    };
  });

  return (
    <div className="w-full h-64 sm:h-80 md:h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-inner p-2 sm:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          data={data} 
          margin={isMobile 
            ? { top: 10, right: 10, bottom: 10, left: 10 } 
            : { top: 20, right: 30, bottom: 20, left: 30 }
          }
        >
          {/* Minimal gradient */}
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#cbd5e1" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ 
              fill: "#475569", 
              fontSize: isMobile ? 10 : 13, 
              fontWeight: 600 
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ 
              fill: "#64748b", 
              fontSize: isMobile ? 9 : 11 
            }}
            tickCount={6}
          />
          <Radar
            dataKey="value"
            stroke="#10b981"
            fill="url(#radarFill)"
            fillOpacity={0.7}
            strokeWidth={isMobile ? 2 : 2.5}
            dot={{ 
              r: isMobile ? 3 : 5, 
              fill: "#10b981", 
              strokeWidth: 2, 
              stroke: "#fff" 
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Tooltip content={<RadarTooltip />} cursor={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}