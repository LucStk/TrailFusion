import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  base: "/static/",
  server: {
    origin: 'http://localhost:5173',
    cors: true,
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
      timeout: 5000
    },
    watch: {
      usePolling: true,
    },

  },
  build: {
    manifest: "manifest.json",
    outDir: resolve("../assets"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
})
