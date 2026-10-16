import { describe, expect, it } from 'vitest';
import type { LayerOfType } from '../style';
import { createContext, feature, styleLayer } from '../test-utils';
import { renderBackground } from './background';
import { circleAttrs, renderCircle } from './circle';
import { fillAttrs, renderFill } from './fill';
import { dashArray, lineAttrs, renderLine } from './line';
import { cssFont, renderSymbol, textOf, textWidth, wrapText } from './symbol';

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
const line = {
	type: 'LineString' as const,
	coordinates: [
		[0, 0],
		[10, 0]
	]
};
const red = { r: 1, g: 0, b: 0, a: 1 };
const halfBlue = { r: 0, g: 0, b: 0.5, a: 0.5 };

describe('background', () => {
	const background = (paint: object) =>
		styleLayer('bg', 'background', { paint }) as LayerOfType<'background'>;

	it('fills the whole map', () => {
		const rect = renderBackground(
			background({ 'background-color': '#ff0000' }),
			createContext()
		)?.firstElementChild;
		expect(rect?.getAttribute('width')).toBe('200');
		expect(rect?.getAttribute('height')).toBe('100');
		expect(rect?.getAttribute('fill')).toBe('#ff0000');
		expect(rect?.hasAttribute('fill-opacity')).toBe(false);
	});

	it('multiplies the opacity with the alpha of the color', () => {
		const rect = renderBackground(
			background({ 'background-color': 'rgba(0,0,0,0.5)', 'background-opacity': 0.5 }),
			createContext()
		)?.firstElementChild;
		expect(rect?.getAttribute('fill-opacity')).toBe('0.25');
	});

	it('draws nothing when it is transparent', () => {
		expect(renderBackground(background({ 'background-opacity': 0 }), createContext())).toBe(
			undefined
		);
	});

	it('fills with a pattern', () => {
		const ctx = createContext({
			dots: { data: { width: 2, height: 2, data: new Uint8Array(16) } }
		});
		const rect = renderBackground(
			background({ 'background-pattern': 'dots' }),
			ctx
		)?.firstElementChild;
		expect(rect?.getAttribute('fill')).toMatch(/^url\(#pattern-/);
	});

	it('gives layers whose ids become the same XML id distinct ids', () => {
		const ctx = createContext();
		const paint = { 'background-color': '#ff0000' };
		const ids = ['road/main', 'road main'].map(
			(id) =>
				renderBackground(styleLayer(id, 'background', { paint }) as LayerOfType<'background'>, ctx)
					?.id
		);
		expect(ids).toEqual(['road_main', 'road_main-2']);
	});
});

describe('fill', () => {
	it('uses the defaults of the style specification', () => {
		const attrs = fillAttrs(feature(square), createContext());
		expect(attrs).toMatchObject({ d: 'M0 0L10 0L10 10L0 0Z', fill: '#000000' });
		expect(attrs?.['fill-opacity']).toBeUndefined();
		expect(attrs?.stroke).toBeUndefined();
	});

	it('multiplies the opacity with the alpha of the color', () => {
		const attrs = fillAttrs(
			feature(square, { paint: { 'fill-color': halfBlue, 'fill-opacity': 0.5 } }),
			createContext()
		);
		expect(attrs).toMatchObject({ fill: '#0000ff', 'fill-opacity': 0.25 });
	});

	it('strokes an outline which has its own color', () => {
		const paint = { 'fill-outline-color': red };
		expect(fillAttrs(feature(square, { paint }), createContext())).toMatchObject({
			stroke: '#ff0000',
			'stroke-width': 1
		});
		expect(
			fillAttrs(feature(square, { paint: { ...paint, 'fill-antialias': false } }), createContext())
				?.stroke
		).toBeUndefined();
	});

	it('moves the geometry by fill-translate', () => {
		const attrs = fillAttrs(
			feature(square, { paint: { 'fill-translate': [5, 2] } }),
			createContext()
		);
		expect(attrs?.d).toBe('M5 2L15 2L15 12L5 2Z');
	});

	it('rotates fill-translate with the map unless it is anchored to the viewport', () => {
		const ctx = { ...createContext(), bearing: 90 };
		const paint = { 'fill-translate': [5, 0] };
		expect(fillAttrs(feature(square, { paint }), ctx)?.d?.toString().startsWith('M0 -5')).toBe(
			true
		);
		expect(
			fillAttrs(feature(square, { paint: { ...paint, 'fill-translate-anchor': 'viewport' } }), ctx)
				?.d
		).toBe('M5 0L15 0L15 10L5 0Z');
	});

	it('fills with a pattern', () => {
		const ctx = createContext({
			dots: { data: { width: 2, height: 2, data: new Uint8Array(16) } }
		});
		const attrs = fillAttrs(feature(square, { paint: { 'fill-pattern': { name: 'dots' } } }), ctx);
		expect(attrs?.fill).toMatch(/^url\(#pattern-/);
	});

	it('skips invisible features', () => {
		expect(
			fillAttrs(feature(square, { paint: { 'fill-opacity': 0 } }), createContext())
		).toBeUndefined();
	});

	it('clips the features to their tile and hoists what they share', () => {
		const ctx = createContext();
		const paint = { 'fill-color': red };
		const group = renderFill(
			styleLayer('land use', 'fill'),
			[
				feature(square, { paint }, { tile: { z: 1, x: 1, y: 0 } }),
				feature(square, { paint }, { tile: { z: 1, x: 1, y: 0 } }),
				feature(square, { paint }, { tile: { z: 1, x: 1, y: 1 } })
			],
			ctx
		);
		expect(group?.getAttribute('id')).toBe('land_use');
		expect(group?.getAttribute('data-layer')).toBe('land use');
		expect(group?.getAttribute('fill')).toBe('#ff0000');
		expect(group?.children).toHaveLength(2);
		expect(group?.children[0].getAttribute('clip-path')).toBe('url(#tile-1-1-0)');
		expect(group?.children[0].children).toHaveLength(2);
		expect(group?.querySelector('path')?.hasAttribute('fill')).toBe(false);
		expect(ctx.defs.querySelectorAll('clipPath')).toHaveLength(2);
	});

	it('draws features of an unknown tile without clipping', () => {
		const group = renderFill(styleLayer('a', 'fill'), [feature(square)], createContext());
		expect(group?.children[0].hasAttribute('clip-path')).toBe(false);
	});

	it('draws nothing when no feature is visible', () => {
		expect(renderFill(styleLayer('a', 'fill'), [], createContext())).toBeUndefined();
	});
});

describe('line', () => {
	const lineFeature = (paint: object = {}, layout: object = {}) =>
		feature(line, { type: 'line', paint, layout });

	it('uses the defaults of the style specification', () => {
		expect(lineAttrs(lineFeature(), createContext())).toMatchObject({
			d: 'M0 0L100 0',
			fill: 'none',
			stroke: '#000000',
			'stroke-width': 1,
			'stroke-linecap': 'butt',
			'stroke-linejoin': 'miter',
			'stroke-miterlimit': 2
		});
	});

	it('writes color, width, opacity, cap and join', () => {
		const attrs = lineAttrs(
			lineFeature(
				{ 'line-color': halfBlue, 'line-width': 3, 'line-opacity': 0.5 },
				{ 'line-cap': 'round', 'line-join': 'round' }
			),
			createContext()
		);
		expect(attrs).toMatchObject({
			stroke: '#0000ff',
			'stroke-width': 3,
			'stroke-opacity': 0.25,
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round'
		});
		expect(attrs?.['stroke-miterlimit']).toBeUndefined();
	});

	it('scales the dashes by the line width', () => {
		expect(dashArray([2, 1], 3)).toBe('6 3');
		expect(dashArray({ from: [1, 2], to: [2, 4] }, 2)).toBe('2 4');
		expect(dashArray(undefined, 2)).toBeUndefined();
		expect(dashArray([1], 2)).toBeUndefined();
		expect(
			lineAttrs(lineFeature({ 'line-dasharray': [2, 2], 'line-width': 2 }), createContext())
		).toMatchObject({ 'stroke-dasharray': '4 4' });
	});

	it('offsets the line to the right', () => {
		expect(lineAttrs(lineFeature({ 'line-offset': 2 }), createContext())?.d).toBe('M0 2L100 2');
	});

	it('draws a line on each side of the gap', () => {
		const attrs = lineAttrs(lineFeature({ 'line-gap-width': 4, 'line-width': 2 }), createContext());
		expect(attrs?.d).toBe('M0 -3L100 -3M0 3L100 3');
		expect(attrs?.['stroke-width']).toBe(2);
	});

	it('closes the rings of a polygon', () => {
		const attrs = lineAttrs(feature(square, { type: 'line' }), createContext());
		expect(attrs?.d?.toString().endsWith('Z')).toBe(true);
	});

	it('skips invisible features', () => {
		expect(lineAttrs(lineFeature({ 'line-width': 0 }), createContext())).toBeUndefined();
		expect(lineAttrs(lineFeature({ 'line-opacity': 0 }), createContext())).toBeUndefined();
	});

	it('draws a path per feature', () => {
		const group = renderLine(
			styleLayer('roads', 'line'),
			[lineFeature({ 'line-width': 2 }), lineFeature({ 'line-width': 4 })],
			createContext()
		);
		const paths = group?.querySelectorAll('path');
		expect(paths).toHaveLength(2);
		expect(group?.getAttribute('stroke')).toBe('#000000');
		expect(paths?.[1].getAttribute('stroke-width')).toBe('4');
	});
});

describe('circle', () => {
	const point = { type: 'Point' as const, coordinates: [1, -1] };
	const circle = (paint: object = {}, extra: object = {}) =>
		feature(point, { type: 'circle', paint }, extra);

	it('uses the defaults of the style specification', () => {
		expect(circleAttrs(circle(), createContext())).toEqual([
			expect.objectContaining({ cx: 10, cy: 10, r: 5, fill: '#000000' })
		]);
	});

	it('puts the stroke outside of the radius', () => {
		const [attrs] = circleAttrs(
			circle({
				'circle-radius': 8,
				'circle-stroke-width': 2,
				'circle-stroke-color': red,
				'circle-opacity': 0.5
			}),
			createContext()
		);
		expect(attrs).toMatchObject({
			r: 9,
			stroke: '#ff0000',
			'stroke-width': 2,
			'fill-opacity': 0.5
		});
	});

	it('draws a circle at every vertex', () => {
		expect(circleAttrs(feature(line, { type: 'circle' }), createContext())).toHaveLength(2);
	});

	it('drops the copies in the buffer of a neighbouring tile', () => {
		// [1, -1] lies in the south-eastern tile of zoom 1
		expect(circleAttrs(circle({}, { tile: { z: 1, x: 1, y: 1 } }), createContext())).toHaveLength(
			1
		);
		expect(circleAttrs(circle({}, { tile: { z: 1, x: 0, y: 1 } }), createContext())).toHaveLength(
			0
		);
	});

	it('drops repeated features of an unknown tile', () => {
		const group = renderCircle(
			styleLayer('points', 'circle'),
			[circle({}, { id: 1 }), circle({}, { id: 1 }), circle({}, { id: 2 })],
			createContext()
		);
		expect(group?.querySelectorAll('circle')).toHaveLength(2);
	});

	it('skips invisible features', () => {
		expect(circleAttrs(circle({ 'circle-opacity': 0 }), createContext())).toEqual([]);
	});
});

describe('symbol', () => {
	const point = { type: 'Point' as const, coordinates: [1, -1] };
	const label = (layout: object = {}, paint: object = {}, geometry: object = point) =>
		feature(geometry as typeof point, {
			type: 'symbol',
			layout: { 'text-field': 'Tokyo', ...layout },
			paint
		});
	const layer = styleLayer('labels', 'symbol');

	it('reads the text of a formatted value', () => {
		expect(textOf('a')).toBe('a');
		expect(textOf({ sections: [{ text: 'a' }, { text: 'b' }, { image: {} }] })).toBe('ab');
		expect(textOf(undefined)).toBe('');
	});

	it('estimates wide scripts as a full em', () => {
		expect(textWidth('ab')).toBeCloseTo(1.1);
		expect(textWidth('東京')).toBe(2);
	});

	it('wraps at text-max-width', () => {
		expect(wrapText('one two three', 5)).toEqual(['one two', 'three']);
		expect(wrapText('a\nb', 10)).toEqual(['a', 'b']);
		expect(wrapText('one two', 0)).toEqual(['one two']);
	});

	it('splits a font name into family, weight and style', () => {
		expect(cssFont(['Noto Sans Bold Italic', 'Arial'])).toEqual({
			'font-family': "'Noto Sans', sans-serif",
			'font-weight': 'bold',
			'font-style': 'italic'
		});
		expect(cssFont(undefined)['font-family']).toBe('sans-serif');
	});

	it('writes a point label as text centered on the feature', () => {
		const text = renderSymbol(layer, [label({ 'text-size': 10 })], createContext())?.querySelector(
			'text'
		);
		expect(text?.textContent).toBe('Tokyo');
		expect(text?.getAttribute('text-anchor')).toBe('middle');
		expect(text?.getAttribute('font-size')).toBe('10');
		const tspan = text?.querySelector('tspan');
		expect(tspan?.getAttribute('x')).toBe('10');
		// the baseline lies a little below the feature so that the text is centered on it
		expect(tspan?.getAttribute('y')).toBe('13.5');
	});

	it('applies anchor, offset, transform and color', () => {
		const text = renderSymbol(
			layer,
			[
				label(
					{
						'text-size': 10,
						'text-anchor': 'top-left',
						'text-offset': [1, 2],
						'text-transform': 'uppercase'
					},
					{ 'text-color': red }
				)
			],
			createContext()
		)?.querySelector('text');
		expect(text?.textContent).toBe('TOKYO');
		expect(text?.getAttribute('text-anchor')).toBe('start');
		expect(text?.getAttribute('fill')).toBe('#ff0000');
		expect(text?.querySelector('tspan')?.getAttribute('x')).toBe('20');
		expect(text?.querySelector('tspan')?.getAttribute('y')).toBe('39.5');
	});

	it('draws the halo as a stroked copy below the text', () => {
		const texts = renderSymbol(
			layer,
			[label({}, { 'text-halo-color': red, 'text-halo-width': 1.5 })],
			createContext()
		)?.querySelectorAll('text');
		expect(texts).toHaveLength(2);
		expect(texts?.[0].getAttribute('stroke')).toBe('#ff0000');
		expect(texts?.[0].getAttribute('stroke-width')).toBe('3');
		expect(texts?.[1].hasAttribute('stroke')).toBe(false);
	});

	it('writes a label along a line as a text path', () => {
		const ctx = createContext();
		const group = renderSymbol(
			layer,
			[label({ 'symbol-placement': 'line', 'text-size': 10 }, {}, line)],
			ctx
		);
		const textPath = group?.querySelector('textPath');
		expect(textPath?.textContent).toBe('Tokyo');
		expect(textPath?.getAttribute('startOffset')).toBe('50%');
		const id = textPath?.getAttribute('href')?.slice(1);
		expect(ctx.defs.querySelector(`[id="${id}"]`)?.getAttribute('d')).toBe('M0 0L100 0');
	});

	it('keeps the text along a line upright', () => {
		const ctx = createContext();
		const reversed = { ...line, coordinates: [...line.coordinates].reverse() };
		renderSymbol(
			layer,
			[label({ 'symbol-placement': 'line', 'text-size': 10 }, {}, reversed)],
			ctx
		);
		expect(ctx.defs.querySelector('path')?.getAttribute('d')).toBe('M0 0L100 0');
	});

	it('leaves out a label which is longer than its line', () => {
		expect(
			renderSymbol(
				layer,
				[label({ 'symbol-placement': 'line', 'text-size': 100 }, {}, line)],
				createContext()
			)
		).toBeUndefined();
	});

	it('draws an icon scaled, anchored at its center', () => {
		const ctx = createContext({
			pin: { data: { width: 20, height: 10, data: new Uint8Array(800) }, pixelRatio: 2 }
		});
		const use = renderSymbol(
			layer,
			[label({ 'text-field': '', 'icon-image': { name: 'pin' }, 'icon-size': 2 })],
			ctx
		)?.querySelector('use');
		expect(use?.getAttribute('href')).toMatch(/^#image-/);
		expect(use?.getAttribute('transform')).toBe('translate(10 10) scale(2) translate(-5 -2.5)');
	});

	it('drops repeated labels', () => {
		const group = renderSymbol(layer, [label(), label()], createContext());
		expect(group?.querySelectorAll('text')).toHaveLength(1);
	});
});
