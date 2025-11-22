"use client";

import { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
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

export default function RadarGraph({ scores = {} }: RadarGraphProps) {
  const [mounted, setMounted] = useState(false);

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Build chart data - normalize scores from 0-100 to 0-10 for radar display
  const data = ORDERED_KEYS.map(({ key, label }) => {
    const value = scores[key] || scores[label] || 0;
    // Normalize: if value is 0-100, convert to 0-10; if already 0-10, keep as is
    const normalizedValue = value > 10 ? value / 10 : value;
    return {
      subject: label,
      value: mounted ? normalizedValue : 0,
    };
  });

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#d1fae5" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "#064e3b",
              fontSize: 12,
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
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#059669"
            strokeWidth={3}
            fill="#10b981"
            fillOpacity={0.6}
            animationDuration={1800}
            animationEasing="ease-out"
            dot={{ fill: "#047857", r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}