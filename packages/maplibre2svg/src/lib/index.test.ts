import { describe, expect, it } from 'vitest';
import { maplibre2svg, svgToString, UnsupportedMapError } from './index';
import { createMap, feature, styleLayer } from './test-utils';

const square = {
	type: 'Polygon' as const,
	coordinates: [
		[
			[0, 0],
			[1, 0],
			[1, -1],
			[0, 0]
		]
	]
};
const road = {
	type: 'LineString' as const,
	coordinates: [
		[0, 0],
		[10, 0]
	]
};

const layers = [
	styleLayer('background', 'background', { paint: { 'background-color': '#eeeeee' } }),
	styleLayer('satellite', 'raster'),
	styleLayer('land', 'fill'),
	styleLayer('hidden', 'fill', { layout: { visibility: 'none' } }),
	styleLayer('roads', 'line'),
	styleLayer('labels', 'symbol', { layout: { 'text-field': 'x' } })
];
const features = {
	land: [feature(square, { id: 'land', type: 'fill' })],
	hidden: [feature(square, { id: 'hidden', type: 'fill' })],
	roads: [feature(road, { id: 'roads', type: 'line' })],
	labels: [
		feature(
			{ type: 'Point', coordinates: [1, -1] },
			{ id: 'labels', type: 'symbol', layout: { 'text-field': 'Tokyo' } }
		)
	]
};

const order = (svg: SVGSVGElement) =>
	[...svg.children]
		.filter((child) => child.tagName !== 'defs')
		.map((child) =>
			child.tagName === 'image'
				? `image:${child.getAttribute('data-layers')}`
				: child.getAttribute('data-layer')
		);

describe('maplibre2svg', () => {
	it('writes vector layers as groups and raster layers as images, in layer order', async () => {
		const mock = createMap(layers, features);
		const svg = await maplibre2svg(mock.map);
		expect(order(svg)).toEqual(['background', 'image:satellite', 'land', 'roads', 'image:labels']);
		expect(svg.querySelector('[data-layer="land"] path')?.getAttribute('d')).toBe(
			'M0 0L10 0L10 10L0 0Z'
		);
	});

	it('renders each raster segment with nothing but its layers visible', async () => {
		const mock = createMap(layers, features);
		const svg = await maplibre2svg(mock.map);
		expect(mock.captures).toEqual([
			['satellite', 'hidden'],
			['hidden', 'labels']
		]);
		const images = svg.querySelectorAll('image');
		expect(images[0].getAttribute('href')).toBe('data:capture/1');
		expect(images[1].getAttribute('href')).toBe('data:capture/2');
		expect(images[0].getAttribute('width')).toBe('200');
	});

	it('writes labels as vectors when asked to', async () => {
		const svg = await maplibre2svg(createMap(layers, features).map, { labels: 'vector' });
		expect(order(svg)).toEqual(['background', 'image:satellite', 'land', 'roads', 'labels']);
		expect(svg.querySelector('text')?.textContent).toBe('Tokyo');
	});

	it('sizes the document in physical units over a viewBox in pixels', async () => {
		const svg = await maplibre2svg(createMap(layers, features).map, {
			width: 297,
			height: 210,
			unit: 'mm'
		});
		expect(svg.getAttribute('width')).toBe('297mm');
		expect(svg.getAttribute('height')).toBe('210mm');
		expect(svg.getAttribute('viewBox')).toBe('0 0 200 100');
	});

	it('falls back to the size of the map in pixels', async () => {
		const svg = await maplibre2svg(createMap(layers, features).map);
		expect(svg.getAttribute('width')).toBe('200');
	});

	it('does not touch the map when there is nothing to rasterize', async () => {
		const mock = createMap([styleLayer('land', 'fill')], features);
		await maplibre2svg(mock.map);
		expect(mock.visibility).toEqual([]);
		expect(mock.captures).toEqual([]);
	});

	it('refuses a map which cannot be converted', async () => {
		const mock = createMap(layers, features, { getTerrain: () => ({ source: 'dem' }) });
		await expect(maplibre2svg(mock.map)).rejects.toBeInstanceOf(UnsupportedMapError);
	});

	it('rasterizes patterns and icons of a map which cannot read its images', async () => {
		const pattern = styleLayer('pattern', 'fill', { paint: { 'fill-pattern': 'dots' } });
		const svg = await maplibre2svg(createMap([pattern], {}, { getImage: undefined }).map);
		expect(order(svg)).toEqual(['image:pattern']);
	});

	it('serializes to a standalone SVG document', async () => {
		const text = svgToString(await maplibre2svg(createMap(layers, features).map));
		expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(text).toContain('viewBox="0 0 200 100"');
	});
});
