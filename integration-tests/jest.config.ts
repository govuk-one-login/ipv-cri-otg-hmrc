import { Config } from "jest";

export default {
  preset: "ts-jest",
  clearMocks: true,
  projects: ["tests/*/jest.config.ts"],
  testMatch: ["<rootDir>/**/*.test.ts"],
  modulePaths: [],
} satisfies Config;
