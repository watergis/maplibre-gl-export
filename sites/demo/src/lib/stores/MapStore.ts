import { writable } from 'svelte/store';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Map as MapboxMap } from 'mapbox-gl';

export const MAPSTORE_CONTEXT_KEY = 'map-store-context-id';

export type MapStore = ReturnType<typeof createMapStore>;

// map store for maplibre-gl object
export const createMapStore = () => {
	const { set, update, subscribe } = writable<MaplibreMap | MapboxMap>(undefined);

	return {
		subscribe,
		update,
		set
	};
};
