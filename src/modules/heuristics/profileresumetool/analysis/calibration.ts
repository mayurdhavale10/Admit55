// src/modules/core-gap/profileresumetool/calibration.ts

export const WEIGHTS = {
  default: {
    academics: 1.0,
    testReadiness: 1.0,
    workImpact: 1.4,
    leadership: 1.2,
    extracurriculars: 0.8,
    internationalExposure: 1.0,
  },
};

export const BANDS = [
  { name: "Needs Focus", min: 0, max: 35 },
  { name: "Emerging", min: 36, max: 44 },
  { name: "Competitive", min: 45, max: 52 },
  { name: "Strong", min: 53, max: 60 },
];

export type Subscores = {
  academics: number;
  testReadiness: number;
  workImpact: number;
  leadership: number;
  extracurriculars: number;
  internationalExposure: number;
};
