import { describe, expect, it } from 'vitest';
import {
	applyNorthIconColor,
	DEFAULT_NORTH_ICON,
	NORTH_ICONS,
	normalizeNorthIconSvg,
	readCustomNorthIcon,
	readNorthIcon
} from './north-icons';

describe('NORTH_ICONS', () => {
	it('offers the compass icons of Font-GIS, north-arrow first', () => {
		expect(NORTH_ICONS.map((icon) => icon.name)).toEqual([
			'north-arrow',
			'north-arrow-n',
			'compass',
			'compass-needle',
			'compass-rose',
			'compass-rose-n',
			'compass-alt',
			'compass-alt-o'
		]);
		expect(DEFAULT_NORTH_ICON).toBe(NORTH_ICONS[0].svg);
	});

	it.each(NORTH_ICONS)('$name is a clean SVG which scales', ({ svg }) => {
		expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 100 100"/);
		expect(svg).toMatch(/<\/svg>$/);
		expect(svg).toMatch(/<path /);
		expect(svg).not.toMatch(/sodipodi|inkscape|metadata|style=|#000080/);
		expect(svg).toContain('fill="currentColor"');
	});
});

describe('normalizeNorthIconSvg', () => {
	it('keeps the shapes and their fill rule, outlined in white', () => {
		const svg = normalizeNorthIconSvg(
			'<?xml version="1.0"?>\n<svg xmlns:inkscape="x" width="100" height="100" id="s">\n' +
				'<metadata><rdf:RDF/></metadata>\n' +
				'<path\n d="M 0,0 L 10,10 Z"\n style="fill:#000080;fill-rule:evenodd;stroke:none"\n' +
				' id="p" inkscape:connector-curvature="0" />\n</svg>'
		);
		expect(svg).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
				'<g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">' +
				'<path d="M 0,0 L 10,10 Z" fill-rule="evenodd" /></g>' +
				'<g fill="currentColor"><path d="M 0,0 L 10,10 Z" fill-rule="evenodd" /></g></svg>'
		);
	});
});

describe('applyNorthIconColor', () => {
	it('replaces currentColor by the colour', () => {
		const svg = applyNorthIconColor(DEFAULT_NORTH_ICON, '#ff0000');
		expect(svg).toContain('fill="#ff0000"');
		expect(svg).not.toContain('currentColor');
	});

	it('is black by default', () => {
		expect(applyNorthIconColor(DEFAULT_NORTH_ICON)).toContain('fill="#000000"');
	});

	it('keeps the colours of an SVG which does not use currentColor', () => {
		const svg = '<svg viewBox="0 0 1 1"><path fill="#00ff00" d="M0 0"/></svg>';
		expect(applyNorthIconColor(svg, '#ff0000')).toBe(svg);
	});
});

describe('readCustomNorthIcon', () => {
	it('rejects a file which is not an SVG', () => {
		expect(readCustomNorthIcon('not an svg')).toBeUndefined();
		expect(readCustomNorthIcon('<html><svg></svg></html>')).toBeUndefined();
		expect(readCustomNorthIcon('<svg><path d="M0 0"/>')).toBeUndefined();
	});

	it('drops the XML declaration, comments, scripts and event handlers', () => {
		expect(
			readCustomNorthIcon(
				'<?xml version="1.0"?><!-- icon --><svg viewBox="0 0 10 10" onload="alert(1)">' +
					'<script>alert(1)</script><path d="M0 0"/></svg>'
			)
		).toBe('<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>');
	});

	it('adds a viewBox from the width and height', () => {
		expect(readCustomNorthIcon('<svg width="24px" height="32"><path d="M0 0"/></svg>')).toBe(
			'<svg viewBox="0 0 24 32" width="24px" height="32"><path d="M0 0"/></svg>'
		);
	});

	it('keeps an SVG without size as it is', () => {
		expect(readCustomNorthIcon('<svg/>')).toBe('<svg/>');
	});
});

describe('readNorthIcon', () => {
	it.each(NORTH_ICONS)('finds $name and its colour in the coloured icon', ({ svg }) => {
		expect(readNorthIcon(applyNorthIconColor(svg, '#dc2626'))).toEqual({
			image: svg,
			color: '#dc2626'
		});
	});

	it('keeps any other SVG, in black', () => {
		const svg = '<svg viewBox="0 0 1 1"><path fill="#00ff00" d="M0 0"/></svg>';
		expect(readNorthIcon(svg)).toEqual({ image: svg, color: '#000000' });
	});
});
