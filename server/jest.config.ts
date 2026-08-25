import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/"],
  testMatch: ["**/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,
  restoreMocks: true,

  moduleNameMapper: {
    // Force all imports of the SDK to our mock
    "^@rtsdk/topia$": "<rootDir>/mocks/@rtsdk/topia.ts",
    "^@rtsdk/topia/(.*)$": "<rootDir>/mocks/@rtsdk/topia.ts",

    // Path alias
    "^@utils/(.*)\\.js$": "<rootDir>/utils/$1",
    "^@utils/(.*)$": "<rootDir>/utils/$1",

    // Strip .js from relative imports (source uses .js suffix for ESM)
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
