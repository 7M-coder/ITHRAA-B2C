import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true }
      }
    },
    preview: { port: 5000, strictPort: true },
    build: { minify: 'terser', sourcemap: false }
  }
})
