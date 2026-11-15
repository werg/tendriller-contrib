import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', timeout: 45_000, workers: 1, reporter: [['list']], outputDir: '../../test-results/e2e',
  use: {
    browserName: 'chromium', baseURL: process.env.TENDRILLER_E2E_SERVICE || 'https://service.localhost:8790', ignoreHTTPSErrors: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--host-resolver-rules=MAP *.localhost 127.0.0.1'] },
    permissions: ['camera', 'microphone', 'geolocation'], trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
});
