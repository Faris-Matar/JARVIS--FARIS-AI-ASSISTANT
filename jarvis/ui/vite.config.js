import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: UI on 5173, API server on 7747 (node ../server/server.js).
// Build: static bundle the server (and later Electron) serves directly.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:7747',
    },
  },
  build: {
    outDir: 'dist',
  },
})
