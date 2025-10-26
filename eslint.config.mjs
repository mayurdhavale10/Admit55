// eslint.config.ts
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Use Next.js core rules
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Global project-wide rules and ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // ✅ Allow temporary use of `any`
      "@typescript-eslint/no-explicit-any": "off",

      // ✅ Allow <img> for now (disable Next.js optimization warning)
      "@next/next/no-img-element": "off",

      // ✅ Avoid JSX quote escape warnings
      "react/no-unescaped-entities": "off",

      // ✅ Ignore unnecessary disable comments
      "@eslint-community/eslint-comments/no-unused-disable": "off",
    },
  },
];

export default eslintConfig;
