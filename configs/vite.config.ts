import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
	root: resolve(__dirname, '../src/client'),
	assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
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
		},
		//		allowedHosts: true,
	},
	build: {
		outDir: '../../dist',
		emptyOutDir: true,
		sourcemap: false,
		rollupOptions: {
			input: {
				main: resolve(__dirname, '../src/client/index.html')
			}
		},
		assetsDir: 'assets',
		// Ensure fonts and other assets are properly copied
		copyPublicDir: true,
	},
	// Fix the publicDir path - this should point to your assets directory
	publicDir: resolve(__dirname, '../src/client/assets'),
	// Add resolve alias to help with imports
	resolve: {
		alias: {
			'@': resolve(__dirname, '../src/client'),
			'@assets': resolve(__dirname, '../src/client/assets')
		}
	}
})
