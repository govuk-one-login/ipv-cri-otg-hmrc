import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ['tests/aws/**/*.test.ts'],
    setupFiles: ['tests/aws/setEnvVars.js'],
    environment: "node",
    testTimeout: 60000,
  },
});
