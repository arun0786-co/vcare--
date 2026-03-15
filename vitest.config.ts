import path from "node:path";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/server/test-env";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/domain/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/server/**/*.test.ts"],
          globalSetup: ["tests/server/global-setup.ts"],
          fileParallelism: false,
          env: {
            DATABASE_URL: TEST_DATABASE_URL,
            APP_BASE_URL: "http://localhost:3000",
          },
        },
      },
    ],
  },
});
