import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "@next/next/no-sync-scripts": "off",
      "react-hooks/exhaustive-deps": "warn", // error → warn으로 낮추기
    },
  },
]);

export default eslintConfig;
