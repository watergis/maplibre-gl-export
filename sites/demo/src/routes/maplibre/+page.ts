import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const title = 'MapLibre GL Export';
	const site_name = 'MapLibre GL Export Demo';
	const site_description = 'Demo website for maplibre-gl-export plugin';

	return {
		title,
		site_name,
		site_description
	};
};

export const prerender = true;
export const ssr = false;
