import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/pong-mp/',
  plugins: [react()],
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    watch: {
      usePolling: true
    }
  }
})
