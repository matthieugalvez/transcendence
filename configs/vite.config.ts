import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
    root: resolve(__dirname, '../src/client'), // Point to client directory
    plugins: [tailwindcss()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
                cookieDomainRewrite: {
                    '*': ''
                }
            },
            '/avatars': 'http://localhost:3000',
            '/health': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://localhost:3000',
                ws: true,
            },
        }
    },
    build: {
        outDir: '../../dist', // Output to project root dist folder
        emptyOutDir: true,
        sourcemap: false,
        minify: 'esbuild',
        assetsDir: 'assets',
        rollupOptions: {
            input: path.resolve(__dirname, '../src/client/index.html'), // Point to correct location
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