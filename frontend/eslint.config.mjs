import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Architectural boundaries: features expose a public API only.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/*/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message:
                "Import a feature through its public API: `@/features/<feature>`.",
            },
          ],
        },
      ],
    },
  },

  // Dependency rule: inner layers never reach outward.
  {
    files: ["src/core/**/*.ts", "src/features/*/domain/**/*.ts", "src/features/*/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/infrastructure/**",
                "**/presentation/**",
                "@/app/**",
                "@/shared/ui/**",
                "next",
                "next/**",
                "react",
                "react-dom",
              ],
              message:
                "Domain and application layers must stay free of frameworks and outer layers.",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
