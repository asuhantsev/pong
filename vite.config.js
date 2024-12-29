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
    sourcemap: true,
    // Ensure assets are properly handled
    assetsDir: 'assets',
    // Optimize CSS splitting
    cssCodeSplit: true,
    // Minify CSS in production
    cssMinify: true
  },
  envPrefix: 'VITE_',
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]__[hash:base64:5]',
      // Only treat files ending with .module.css as CSS modules
      test: /\.module\.css$/,
      // Add global CSS variables
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    },
    // Enable source maps for development
    devSourcemap: true
  },
  // Add asset handling optimization
  assetsInclude: ['**/*.{png,jpg,gif,svg,webp,woff,woff2,eot,ttf,otf}'],
  // Optimize dev server
  server: {
    port: 5173,
    strictPort: true,
    cors: true
  },
  // Production optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
