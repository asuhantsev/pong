import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: mode === 'production' ? '/pong/' : '/',
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production' 
          ? '[hash:base64:8]' 
          : '[name]__[local]__[hash:base64:5]',
      },
      preprocessorOptions: {
        css: {
          charset: false,
          additionalData: `@import "/src/styles/base/variables.module.css";`
        }
      }
    },
    
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
          inlineDynamicImports: true
        }
      },
      sourcemap: mode === 'development',
      assetsDir: 'assets',
      cssCodeSplit: true,
      cssMinify: mode === 'production',
      // Minification options
      minify: mode === 'production' ? 'esbuild' : false,
    },
    
    envPrefix: 'VITE_',
    
    server: {
      port: parseInt(env.VITE_BASE_URL?.split(':')[2] || '5173'),
      strictPort: true,
      cors: true,
      hmr: {
        overlay: mode === 'development'
      }
    },

    // Development-specific options
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production'
    }
  }
})
