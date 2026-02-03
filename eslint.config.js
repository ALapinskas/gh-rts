import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
    ...nextVitals,
    // Override default ignores of eslint-config-next.
    {
    // Apply to all source files (adjust the glob if you want a narrower scope)
        files: ["**/*.{js,jsx,ts,tsx}"],

        // Keep the default ignores from the Next preset
        ignores: [
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ],

        // -----------------------------------------------------------------
        // Custom rules
        // -----------------------------------------------------------------
        rules: {
            // Enforce 4‑space indentation
            indent: ["error", 4, { SwitchCase: 1 }],

            // You can add any other rule overrides here
            // e.g., "no-console": "warn",
        },
    },
    globalIgnores([
    // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
