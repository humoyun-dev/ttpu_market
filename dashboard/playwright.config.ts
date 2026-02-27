import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    port: 3100,
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:3100",
  },
});

