import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist',
		sourcemap: true,
		lib: {
			entry: resolve(import.meta.dirname, 'src/lib/index.ts'),
			name: 'maplibre2svg',
			fileName: (format) => `maplibre2svg.${format}.js`,
			formats: ['es', 'umd']
		}
	},
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.test.ts']
	}
});
