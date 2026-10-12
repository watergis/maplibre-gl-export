import type { Map as MaplibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import { UnsupportedMapError, type QueriedFeature, type TileId } from './types';

/**
 * Throw an {@link UnsupportedMapError} when the state of the map cannot be converted.
 *
 * Positions are projected one by one, which neither follows the elevation of a terrain
 * nor the curvature of a globe.
 */
export function assertSupported(map: MaplibreMap) {
	if (map.getTerrain?.()) {
		throw new UnsupportedMapError('A map with terrain cannot be converted to vectors');
	}
	const projection = map.getProjection?.()?.type;
	if (projection !== undefined && projection !== null && projection !== 'mercator') {
		throw new UnsupportedMapError(
			'Only a map in the mercator projection can be converted to vectors'
		);
	}
}

/** Size of the map in CSS pixels. The canvas itself is larger by the device pixel ratio. */
export function getMapSize(map: MaplibreMap) {
	const canvas = map.getCanvas();
	return {
		width: parseFloat(canvas.style.width) || canvas.clientWidth || canvas.width,
		height: parseFloat(canvas.style.height) || canvas.clientHeight || canvas.height
	};
}

/**
 * Tile a feature was read from. It is not part of the public API of MapLibre GL JS, but it
 * is the only way to tell apart the copies of a feature which neighbouring tiles hold in
 * their buffers.
 */
function featureTile(feature: MapGeoJSONFeature): TileId | undefined {
	const { _z: z, _x: x, _y: y } = feature;
	if (typeof z === 'number' && typeof x === 'number' && typeof y === 'number') return { z, x, y };
	return undefined;
}

/**
 * Rendered features of a layer in drawing order, bottom first. Their `layer` holds the
 * paint and layout properties which the map evaluated for each feature.
 */
export function queryLayerFeatures(map: MaplibreMap, layerId: string): QueriedFeature[] {
	return (
		map
			.queryRenderedFeatures({ layers: [layerId] })
			// the topmost feature comes first
			.reverse()
			.map((feature) => ({
				id: feature.id,
				geometry: feature.geometry,
				properties: feature.properties,
				layer: feature.layer as QueriedFeature['layer'],
				tile: featureTile(feature)
			}))
	);
}

/** Resolve once the map has finished rendering, or after `timeout` ms */
export function waitForIdle(map: MaplibreMap, timeout: number) {
	return new Promise<void>((resolve) => {
		const timer = setTimeout(resolve, timeout);
		map.once('idle', () => {
			clearTimeout(timer);
			resolve();
		});
	});
}
