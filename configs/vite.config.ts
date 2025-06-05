import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: './src/client',
  plugins: [tailwindcss()],
  server: {
    port: 5173, // Development server port
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    sourcemap: false, // Disable in production
    minify: 'esbuild',
    assetsDir: 'assets',
    rollupOptions: {
      input: path.resolve(__dirname, '../src/client/index.html'),
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src/client'),
    }
  }
})