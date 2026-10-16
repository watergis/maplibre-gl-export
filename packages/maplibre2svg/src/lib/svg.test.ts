import { describe, expect, it } from 'vitest';
import { createIdAllocator, el, fmt, hoistCommonAttrs, svgToString, toId, type Attrs } from './svg';

describe('fmt', () => {
	it('rounds to 2 decimals', () => {
		expect(fmt(1.005)).toBe('1');
		expect(fmt(1.236)).toBe('1.24');
		expect(fmt(-0.001)).toBe('0');
	});
});

describe('toId', () => {
	it('makes a valid XML id', () => {
		expect(toId('road/major (casing)')).toBe('road_major__casing_');
		expect(toId('3d-buildings')).toBe('_3d-buildings');
	});
});

describe('createIdAllocator', () => {
	it('keeps ids unique when different strings become the same id', () => {
		const id = createIdAllocator();
		expect(id('road/main')).toBe('road_main');
		expect(id('road main')).toBe('road_main-2');
		expect(id('road_main')).toBe('road_main-3');
		expect(id('water')).toBe('water');
	});
});

describe('el', () => {
	it('creates an SVG element and skips undefined attributes', () => {
		const node = el(document, 'path', { d: 'M0 0', stroke: undefined, 'stroke-width': 1.5 });
		expect(node.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(node.getAttribute('stroke-width')).toBe('1.5');
		expect(node.hasAttribute('stroke')).toBe(false);
	});

	it('writes links as href and xlink:href', () => {
		const node = el(document, 'use', { href: '#a' });
		expect(node.getAttribute('href')).toBe('#a');
		expect(node.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#a');
	});
});

describe('hoistCommonAttrs', () => {
	it('moves the attributes all items share to the parent', () => {
		const parent = el(document, 'g');
		const items: Attrs[] = [
			{ d: 'a', fill: 'red', stroke: 'blue' },
			{ d: 'a', fill: 'red', stroke: 'green' }
		];
		hoistCommonAttrs(parent, items, ['d']);
		expect(parent.getAttribute('fill')).toBe('red');
		expect(parent.hasAttribute('stroke')).toBe(false);
		expect(parent.hasAttribute('d')).toBe(false);
		expect(items[0]).toEqual({ d: 'a', stroke: 'blue' });
	});

	it('keeps the attributes of a single item', () => {
		const parent = el(document, 'g');
		const items: Attrs[] = [{ fill: 'red' }];
		hoistCommonAttrs(parent, items);
		expect(items[0].fill).toBe('red');
	});
});

describe('svgToString', () => {
	it('serializes a standalone document', () => {
		const text = svgToString(el(document, 'svg', {}, [el(document, 'rect', { width: 1 })]));
		expect(text.startsWith('<?xml')).toBe(true);
		expect(text).toContain('<rect');
	});
});
