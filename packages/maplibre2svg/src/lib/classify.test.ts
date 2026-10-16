import { describe, expect, it } from 'vitest';
import { buildSegments, classifyLayer, type ClassifyOptions } from './classify';
import type { StyleLayer } from './style';
import { styleLayer } from './test-utils';

const options: ClassifyOptions = { zoom: 10, pitch: 0, labels: 'raster', hasImages: true };
const layer = (type: string, extra: object = {}) => styleLayer(type, type, extra);

describe('classifyLayer', () => {
	it('draws background, fill, line and circle layers as vectors', () => {
		for (const type of ['background', 'fill', 'line', 'circle']) {
			expect(classifyLayer(layer(type), options)).toBe('vector');
		}
	});

	it('rasterizes the layer types which have no vector counterpart', () => {
		for (const type of ['raster', 'hillshade', 'heatmap', 'fill-extrusion', 'color-relief']) {
			expect(classifyLayer(layer(type), options)).toBe('raster');
		}
		expect(classifyLayer(layer('some-future-type'), options)).toBe('raster');
	});

	it('skips layers which are hidden or out of their zoom range', () => {
		expect(classifyLayer(layer('fill', { layout: { visibility: 'none' } }), options)).toBe('skip');
		expect(classifyLayer(layer('fill', { minzoom: 11 }), options)).toBe('skip');
		expect(classifyLayer(layer('fill', { maxzoom: 10 }), options)).toBe('skip');
		expect(classifyLayer(layer('fill', { minzoom: 10, maxzoom: 11 }), options)).toBe('vector');
	});

	it('rasterizes layers which use a property without a vector counterpart', () => {
		const paint = (value: Record<string, unknown>) => layer('line', { paint: value });
		expect(classifyLayer(paint({ 'line-gradient': ['interpolate'] }), options)).toBe('raster');
		expect(classifyLayer(paint({ 'line-pattern': 'stripes' }), options)).toBe('raster');
		expect(classifyLayer(paint({ 'line-blur': 2 }), options)).toBe('raster');
		expect(classifyLayer(paint({ 'line-blur': 0 }), options)).toBe('vector');
		expect(classifyLayer(layer('circle', { paint: { 'circle-blur': 0.5 } }), options)).toBe(
			'raster'
		);
	});

	it('needs the images of the style for patterns', () => {
		const pattern = layer('fill', { paint: { 'fill-pattern': 'dots' } });
		expect(classifyLayer(pattern, options)).toBe('vector');
		expect(classifyLayer(pattern, { ...options, hasImages: false })).toBe('raster');
	});

	it('rasterizes a background whose properties are expressions', () => {
		const background = layer('background', {
			paint: { 'background-color': ['interpolate', ['linear'], ['zoom'], 0, 'red', 10, 'blue'] }
		});
		expect(classifyLayer(background, options)).toBe('raster');
	});

	it('writes symbol layers as the label mode says', () => {
		const text = layer('symbol', { layout: { 'text-field': 'a' } });
		const icon = layer('symbol', { layout: { 'icon-image': 'pin' } });
		expect(classifyLayer(text, options)).toBe('symbol');
		expect(classifyLayer(text, { ...options, labels: 'vector' })).toBe('vector');
		expect(classifyLayer(icon, { ...options, labels: 'vector' })).toBe('vector');
		expect(classifyLayer(icon, { ...options, labels: 'vector', hasImages: false })).toBe('symbol');
	});

	it('rasterizes icons placed along lines', () => {
		const vector = { ...options, labels: 'vector' as const };
		const along = (layout: object) => layer('symbol', { layout });
		expect(
			classifyLayer(along({ 'icon-image': 'arrow', 'symbol-placement': 'line' }), vector)
		).toBe('symbol');
		expect(
			classifyLayer(along({ 'icon-image': 'arrow', 'symbol-placement': 'line-center' }), vector)
		).toBe('symbol');
		expect(classifyLayer(along({ 'text-field': 'a', 'symbol-placement': 'line' }), vector)).toBe(
			'vector'
		);
		expect(classifyLayer(along({ 'icon-image': 'pin', 'symbol-placement': 'point' }), vector)).toBe(
			'vector'
		);
	});

	it('rasterizes circles which a pitched map scales or lays flat', () => {
		const circle = (paint: object = {}) => layer('circle', { paint });
		const pitched = { ...options, pitch: 45 };
		expect(classifyLayer(circle(), options)).toBe('vector');
		expect(classifyLayer(circle({ 'circle-pitch-alignment': 'map' }), options)).toBe('vector');
		expect(classifyLayer(circle(), pitched)).toBe('raster');
		expect(classifyLayer(circle({ 'circle-pitch-scale': 'map' }), pitched)).toBe('raster');
		expect(classifyLayer(circle({ 'circle-pitch-scale': 'viewport' }), pitched)).toBe('vector');
		expect(
			classifyLayer(
				circle({ 'circle-pitch-scale': 'viewport', 'circle-pitch-alignment': 'map' }),
				pitched
			)
		).toBe('raster');
	});
});

describe('buildSegments', () => {
	const ids = (layers: StyleLayer[]) =>
		buildSegments(layers, options).map((segment) =>
			segment.kind === 'vector'
				? `v:${segment.layers.map((l) => l.id).join(',')}`
				: `r:${segment.layerIds.join(',')}`
		);
	const named = styleLayer;

	it('keeps the layer order and merges neighbours of the same kind', () => {
		expect(
			ids([
				named('bg', 'background'),
				named('satellite', 'raster'),
				named('hills', 'hillshade'),
				named('land', 'fill'),
				named('roads', 'line'),
				named('heat', 'heatmap'),
				named('points', 'circle')
			])
		).toEqual(['v:bg', 'r:satellite,hills', 'v:land,roads', 'r:heat', 'v:points']);
	});

	it('gathers rasterized symbol layers on top', () => {
		expect(
			ids([
				named('land', 'fill'),
				named('labels-1', 'symbol'),
				named('roads', 'line'),
				named('labels-2', 'symbol')
			])
		).toEqual(['v:land,roads', 'r:labels-1,labels-2']);
	});

	it('keeps symbol layers in place when they are written as text', () => {
		const segments = buildSegments(
			[named('land', 'fill'), named('labels', 'symbol'), named('roads', 'line')],
			{ ...options, labels: 'vector' }
		);
		expect(segments).toHaveLength(1);
	});

	it('leaves out skipped layers', () => {
		expect(ids([named('hidden', 'fill', { layout: { visibility: 'none' } })])).toEqual([]);
	});
});
