import type { Map as MaplibreMap } from 'maplibre-gl';
import { waitForIdle } from './map';

/**
 * Render groups of layers by the map itself, one image per group.
 *
 * Every other layer is hidden while a group is rendered, so that the image holds nothing
 * but that group on a transparent background. The visibility of all layers is restored
 * afterwards.
 *
 * @param groups ids of the layers of each image
 * @param visibleLayerIds ids of all layers which are visible to begin with
 * @returns PNG data URL of each group
 */
export async function captureRasterGroups(
	map: MaplibreMap,
	groups: string[][],
	visibleLayerIds: string[],
	idleTimeout: number
): Promise<string[]> {
	if (groups.length === 0) return [];

	const setVisibility = (id: string, visible: boolean) =>
		map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');

	const images: string[] = [];
	const shown = new Set(visibleLayerIds);
	try {
		for (const group of groups) {
			const wanted = new Set(group);
			let changed = false;
			for (const id of visibleLayerIds) {
				if (shown.has(id) === wanted.has(id)) continue;
				setVisibility(id, wanted.has(id));
				if (wanted.has(id)) shown.add(id);
				else shown.delete(id);
				changed = true;
			}
			// the map does not become idle again when nothing has to be rendered
			if (changed) await waitForIdle(map, idleTimeout);
			images.push(map.getCanvas().toDataURL('image/png'));
		}
	} finally {
		for (const id of visibleLayerIds) {
			if (!shown.has(id)) setVisibility(id, true);
		}
	}
	return images;
}
