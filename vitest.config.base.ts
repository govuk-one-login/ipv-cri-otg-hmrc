import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      POWERTOOLS_LOG_LEVEL: "SILENT",
    },
  },
});
