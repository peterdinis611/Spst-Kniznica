// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Common in Next.js client components (hydration, prop→state sync, mount fetch).
      // Keep visible as warnings; do not fail CI until refactors land.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Storybook CSF decorators are often inline wrappers; display names are noise there.
    files: ["**/*.stories.@(ts|tsx|js|jsx)", ".storybook/**"],
    rules: {
      "react/display-name": "off",
    },
  },
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
