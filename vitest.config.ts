import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
    // Playwright owns e2e/. Vitest must not try to collect those specs.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/application/**'],
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
})
