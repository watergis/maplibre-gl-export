import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook',
		'@storybook/addon-vitest',
		'@storybook/addon-a11y',
		'@storybook/addon-docs'
	],
	framework: '@storybook/sveltekit',
	viteFinal: (config) => {
		config.plugins = [
			...(config.plugins ?? []),
			{
				// The browser asks for /favicon.ico, which SvelteKit answers with its error page. That
				// page fails inside Storybook (`__STORYBOOK_MODULE_TEST__ is not defined`) and covers
				// the stories with the error overlay of Vite, so the request is answered here.
				name: 'storybook-favicon',
				configureServer(server) {
					server.middlewares.use('/favicon.ico', (_req, res) => {
						res.statusCode = 204;
						res.end();
					});
				}
			}
		];
		return config;
	}
};
export default config;
