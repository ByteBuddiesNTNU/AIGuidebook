/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/modules/ai-logs/ai-logs.service.ts",
    "src/modules/declarations/declarations.service.ts",
    "src/modules/compliance/compliance.service.ts",
    "src/modules/analytics/analytics.service.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "/prisma/"],
  coverageDirectory: "<rootDir>/coverage",
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 70,
      functions: 80,
      statements: 60,
    },
  },
  clearMocks: true,
};
