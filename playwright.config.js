// Browser tests (npm run test:browser). Writes results/results.xml (JUnit, for Flaw
// Patrol) and results/results.json, and keeps a screenshot, video and trace only for
// tests that fail, in results/files.
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "e2e",
  outputDir: "results/files",
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["junit", { outputFile: "results/results.xml" }],
    ["json", { outputFile: "results/results.json" }],
  ],
  use: {
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    // A click that can't happen (say, something covers the button) fails after 5 seconds
    // instead of waiting out the whole test.
    actionTimeout: 5000,
    // Slows each click and keystroke a little so the videos are easy to follow.
    launchOptions: {
      slowMo: 150,
      ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
    },
  },
  projects: [{ name: "Chrome", use: { ...devices["Desktop Chrome"] } }],
});
