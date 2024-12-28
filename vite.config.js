import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pong/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Prevent code splitting
        inlineDynamicImports: true
      }
    },
    // Add source maps for debugging
    sourcemap: true
  },
  envPrefix: 'VITE_',
})
