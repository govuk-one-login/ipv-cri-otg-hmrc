import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ['tests/aws/**/*.test.ts'],
    setupFiles: ['tests/aws/setEnvVars.js'],
    environment: "node",
    threads: false,
    testTimeout: 60000,
  },
});
