import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			// maplibre-gl is only referenced by the MapLibre map generator, which is never used here.
			// Point it to mapbox-gl (external) so that MapLibre GL JS is not bundled.
			'maplibre-gl': 'mapbox-gl'
		}
	},
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/lib/index.ts'),
			name: 'MapboxExportControl',
			fileName: (format) => `mapbox-gl-export.${format}.js`,
			formats: ['es', 'umd']
		},
		rollupOptions: {
			external: ['mapbox-gl'], // バンドルしたくない依存関係を指定
			output: {
				globals: {
					'mapbox-gl': 'mapboxgl' // UMDビルド時に、external指定した依存関係をscript タグで読み込まれた場合に使用される変数名を指定
				}
			}
		}
	},
	plugins: [],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			}
		}
	}
});
