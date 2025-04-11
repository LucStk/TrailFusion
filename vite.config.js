import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path'


export default defineConfig({
  plugins:[solidPlugin()],
  base: "/static/",
  server: {
    open: true,
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
      timeout: 5000,
    },
    watch: {
      usePolling: true,
    },

  },
  build: {
    manifest: "manifest.json",
    outDir: resolve("../assets"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
})