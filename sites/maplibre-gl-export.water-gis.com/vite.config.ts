import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				mapbox: resolve(__dirname, 'mapbox.html'),
				maplibre: resolve(__dirname, 'maplibre.html')
			}
		}
	},
	plugins: []
});
