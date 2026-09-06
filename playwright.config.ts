import { defineConfig, devices } from '@playwright/test'

/**
 * End to end runs against the production build, served at the same subpath
 * GitHub Pages uses. That is the only way a base path or service worker
 * mistake shows up before it reaches the deployed site.
 */
const PORT = 4173
const BASE_PATH = '/diet/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  reporter: process.env['CI'] === undefined ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 120_000,
  },
})
