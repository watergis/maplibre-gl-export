import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { resolve } from 'path';

const config: UserConfig = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$example: resolve('./src/example')
		}
	},
	ssr: {
		noExternal: ['maplibre-gl']
	}
};

export default config;
