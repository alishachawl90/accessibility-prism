import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/specs',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test/report' }]],
  use: {
    baseURL: 'http://localhost:9333',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'node test/fixtures/server.js',
    port: 9333,
    reuseExistingServer: !process.env.CI,
  },
});
