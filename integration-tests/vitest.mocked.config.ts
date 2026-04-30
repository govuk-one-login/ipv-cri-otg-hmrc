import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ['tests/mocked/**/*.test.ts'],
    environment: "node",
    threads: false,
    testTimeout: 60000,
  },
});
