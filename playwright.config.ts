import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "lectures",
  // Lecture 5 needs its local API server, so it has its own config:
  // npx playwright test -c lectures/05-api-testing   (or: npm run test:api)
  testIgnore: ["05-api-testing/**"],
  timeout: 30_000,
  // On CI, fail the run if a test.only was committed by mistake.
  forbidOnly: !!process.env.CI,
  // Retry only on CI, where a retry also records a trace (see `trace` below).
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  // Every test runs once per project. Test code never chooses the browser: the built-in
  // `page` fixture is created from the project's settings, so every pattern is cross-browser.
  // Run one browser with --project=chrome or --project=firefox.
  projects: [
    {
      name: "chrome",
      // The installed Google Chrome (stable channel), not Playwright's bundled Chromium.
      // If Chrome is missing, install it with: npx playwright install chrome
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});