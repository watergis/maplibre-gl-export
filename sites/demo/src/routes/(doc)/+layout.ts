import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
	const title = 'Maplibre/Mapbox GL Export';
	const site_name = 'Maplibre/Mapbox GL Export Demo';
	const site_description = 'Demo website for maplibre-gl-export and mapbox-gl-export plugins';

	return {
		title,
		site_name,
		site_description
	};
};
