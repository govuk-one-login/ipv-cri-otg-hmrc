/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["lambdas/**/*.{js,ts}", "!**/tests/**"],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coveragePathIgnorePatterns: ["config.ts", "node_modules/"],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
  testMatch: ["**/tests/**/*.test.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
};
