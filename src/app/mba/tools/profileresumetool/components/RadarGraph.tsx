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

// Custom tooltip to show “Subject: XX / 100”
function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl bg-white/95 border border-emerald-100 px-3 py-2 shadow-md text-xs">
      <div className="font-semibold text-gray-800">{item.subject}</div>
      <div className="text-emerald-700 mt-0.5">
        {item.fullScore} / 100
      </div>
    </div>
  );
}

export default function RadarGraph({ scores = {} }: RadarGraphProps) {
  const [mounted, setMounted] = useState(false);

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Build chart data:
  // - Treat incoming values as either 0–10 or 0–100
  // - Store both normalized (0–10) and full (0–100) for tooltip
  const data = ORDERED_KEYS.map(({ key, label }) => {
    const raw = scores[key] ?? scores[label] ?? 0;
    const fullScore = raw > 10 ? Math.max(0, Math.min(100, raw)) : raw * 10; // clamp & scale
    const normalizedValue = fullScore / 10; // 0–10 for radar

    return {
      subject: label,
      value: mounted ? normalizedValue : 0,
      fullScore: Math.round(fullScore),
    };
  });

  return (
    <div className="w-full h-[380px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="65%"
          data={data}
          margin={{ top: 24, right: 40, bottom: 24, left: 40 }}
        >
          {/* Gradient + subtle glow */}
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
            </linearGradient>
          </defs>

          <PolarGrid
            stroke="#bbf7d0"
            strokeWidth={1}
            radialLines={false}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "#064e3b",
              fontSize: 11,
              fontWeight: 600,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: "#6ee7b7", fontSize: 10 }}
            tickCount={6}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<RadarTooltip />} />

          <Radar
            name="Score"
            dataKey="value"
            stroke="#059669"
            strokeWidth={2.5}
            fill="url(#radarGradient)"
            fillOpacity={0.7}
            animationDuration={1800}
            animationEasing="ease-out"
            dot={{ fill: "#047857", r: 4, strokeWidth: 2, stroke: "#ecfdf5" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
