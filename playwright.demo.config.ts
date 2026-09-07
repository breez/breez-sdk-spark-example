import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * Records a walkthrough of a feature against the local regtest cluster, as a
 * video and a screenshot per screen. Not a test: nothing here asserts.
 *
 *   npx playwright test --config playwright.demo.config.ts
 */
export default defineConfig({
  testDir: './e2e/demo',
  testMatch: '**/*.demo.ts',
  outputDir: './demo/run',
  workers: 1,
  retries: 0,
  timeout: 15 * 60_000,
  reporter: 'list',
  use: {
    actionTimeout: 15_000,
    ...devices['Desktop Chrome'],
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173/?network=regtest',
    // A phone-sized window: the layout the wallet is designed for.
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    video: { mode: 'on', size: { width: 430, height: 932 } },
    launchOptions: { slowMo: 250 },
  },
  webServer: {
    command: 'VITE_STAGING_PASSWORD= npm run dev',
    url: 'http://localhost:5173/?network=regtest',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
