import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/lib/index.ts'),
			name: 'MaplibreExportControl',
			fileName: (format) => `maplibre-gl-export.${format}.js`,
			formats: ['es', 'umd']
		},
		rollupOptions: {
			external: ['maplibre-gl'], // バンドルしたくない依存関係を指定
			output: {
				globals: {
					'maplibre-gl': 'maplibregl' // UMDビルド時に、external指定した依存関係をscript タグで読み込まれた場合に使用される変数名を指定
				}
			}
		}
	},
	plugins: []
});
