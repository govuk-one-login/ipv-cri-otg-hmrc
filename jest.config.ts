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
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
  testMatch: ["**/tests/**/*.test.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
};
