import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	return {
		metadata: {
			title: 'MapLibre/Mapbox GL Export',
			description:
				'MapLibre/Mapbox GL Export is a MapLibre/Mapbox GL JS plugin that can export a map image in various image format such as PNG, JPEG, PDF and SVG without any server!',
			author: 'JinIgarashi',
			licenses: [
				'The source code is licensed MIT',
				'The website content is licensed CC BY NC SA 4.0.'
			],
			contact: 'https://jin-igarashi.me'
		},
		nav: [
			{ href: 'https://twitter.com/j_igarashi', icon: 'fa-brands fa-x-twitter' },
			{
				href: 'https://github.com/watergis/maplibre-gl-export',
				icon: 'fa-brands fa-github'
			}
		]
	};
};

export const prerender = true;
export const ssr = false;
