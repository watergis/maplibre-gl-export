import { describe, expect, it, vi } from 'vitest';
import { assertSupported, getMapSize, queryLayerFeatures, waitForIdle } from './map';
import { createMap, styleLayer } from './test-utils';
import { UnsupportedMapError } from './types';

const layers = [styleLayer('land', 'fill')];
const point = { type: 'Point' as const, coordinates: [0, 0] };

describe('assertSupported', () => {
	it('supports a mercator map without terrain', () => {
		expect(() => assertSupported(createMap(layers).map)).not.toThrow();
		const mercator = createMap(layers, {}, { getProjection: () => ({ type: 'mercator' }) });
		expect(() => assertSupported(mercator.map)).not.toThrow();
	});

	it('refuses terrain and other projections', () => {
		const terrain = createMap(layers, {}, { getTerrain: () => ({ source: 'dem' }) });
		expect(() => assertSupported(terrain.map)).toThrow(UnsupportedMapError);
		const globe = createMap(layers, {}, { getProjection: () => ({ type: 'globe' }) });
		expect(() => assertSupported(globe.map)).toThrow(UnsupportedMapError);
	});
});

describe('getMapSize', () => {
	it('reads the size of the map in CSS pixels', () => {
		expect(getMapSize(createMap(layers).map)).toEqual({ width: 200, height: 100 });
	});
});

describe('queryLayerFeatures', () => {
	it('returns the features bottom first, with the tile they were read from', () => {
		const queryRenderedFeatures = vi.fn(() => [
			{ id: 'top', geometry: point, properties: {}, _z: 2, _x: 1, _y: 3 },
			{ id: 'bottom', geometry: point, properties: {} }
		]);
		const features = queryLayerFeatures(
			createMap(layers, {}, { queryRenderedFeatures }).map,
			'land'
		);
		expect(queryRenderedFeatures).toHaveBeenCalledWith({ layers: ['land'] });
		expect(features.map((feature) => feature.id)).toEqual(['bottom', 'top']);
		expect(features[1].tile).toEqual({ z: 2, x: 1, y: 3 });
		expect(features[0].tile).toBeUndefined();
	});
});

describe('waitForIdle', () => {
	it('waits for the map to become idle, but not forever', async () => {
		await waitForIdle(createMap(layers).map, 1000);
		await waitForIdle(createMap(layers, {}, { once: () => {} }).map, 5);
	});
});
