import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { transform } from 'lightningcss';
import type { Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

const CSS_FILE_NAME = 'maplibre-gl-export';

/**
 * Emit a minified copy of the CSS of the plugin, `maplibre-gl-export.min.css`, next to the
 * readable `maplibre-gl-export.css`.
 */
const minifiedCss = (): Plugin => ({
	name: 'maplibre-gl-export:minified-css',
	apply: 'build',
	// after Vite has added the CSS to the bundle
	enforce: 'post',
	generateBundle(_, bundle) {
		const css = bundle[`${CSS_FILE_NAME}.css`];
		if (css?.type !== 'asset') return;
		const { code } = transform({
			filename: css.fileName,
			code: Buffer.from(css.source),
			minify: true
		});
		this.emitFile({ type: 'asset', fileName: `${CSS_FILE_NAME}.min.css`, source: code });
	}
});

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		// the readable CSS; `minifiedCss` adds the minified one
		cssMinify: false,
		lib: {
			entry: resolve(__dirname, 'src/lib/index.ts'),
			name: 'MaplibreExportControl',
			fileName: (format) => `maplibre-gl-export.${format}.js`,
			// the styles of the plugin and of the Svelte components, in one file
			cssFileName: CSS_FILE_NAME,
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
	test: {
		include: ['src/**/*.test.ts']
	},
	plugins: [
		minifiedCss(),
		// the export UI (`@watergis/export-ui`) is written in Svelte and bundled into the plugin
		svelte(),
		// a single `index.d.ts`, with the types of the unpublished `@watergis/export-ui` inlined
		dts({
			tsconfigPath: './tsconfig.json',
			entryRoot: 'src/lib',
			outDirs: 'dist/types',
			exclude: ['src/**/*.test.ts'],
			bundleTypes: {
				bundledPackages: ['@watergis/export-ui']
			}
		})
	],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			}
		}
	}
});
