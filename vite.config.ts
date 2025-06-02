import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'src',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    assetsDir: 'assets',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html'),
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})