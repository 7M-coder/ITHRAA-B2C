import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    // jsdom 25 cannot parse Ant Design's CSS layers; verify styles in a real browser.
    onConsoleLog(log) {
      if (log.includes('Could not parse CSS stylesheet')) return false
    },
    setupFiles: ['src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/tests/**', 'src/vite-env.d.ts']
    }
  }
})
