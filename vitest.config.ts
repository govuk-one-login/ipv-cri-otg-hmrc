import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["lambdas/*"],
    coverage: {
      reporter: ["text", "lcov"],
    },
  },
});
