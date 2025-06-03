import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  root: './src/client',
  plugins: [tailwindcss()],
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
      input: path.resolve(__dirname, '../src/client/index.html'),
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})