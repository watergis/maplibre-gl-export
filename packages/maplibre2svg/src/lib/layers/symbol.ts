import { toCssColor } from '../color';
import { geometryToPaths, geometryToPoints, pathData, pathLength, type Path } from '../geometry';
import { imageName } from '../pattern';
import { el, fmt, type Attrs } from '../svg';
import { isInTile } from '../tile-clip';
import { properties, type StyleLayer } from '../style';
import type { Point, QueriedFeature } from '../types';
import { layerGroup, type RenderContext } from './common';

/** Share of the font size the baseline lies below the middle of a line of text */
const BASELINE_SHIFT = 0.35;

/** Text of an evaluated `text-field`, which is a string or formatted sections */
export function textOf(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	const sections = (value as { sections?: { text?: unknown }[] } | undefined)?.sections;
	if (!Array.isArray(sections)) return '';
	return sections.map((section) => (typeof section.text === 'string' ? section.text : '')).join('');
}

/** Estimated width of a text in ems */
export function textWidth(text: string) {
	let width = 0;
	// wide scripts such as CJK take a full em per character
	for (const char of text) width += char.charCodeAt(0) > 0x2e7f ? 1 : 0.55;
	return width;
}

/** Break a text into lines no wider than `maxWidth` ems, as `text-max-width` does */
export function wrapText(text: string, maxWidth: number): string[] {
	const lines: string[] = [];
	for (const paragraph of text.split('\n')) {
		let line = '';
		for (const word of paragraph.split(' ')) {
			const candidate = line ? `${line} ${word}` : word;
			if (line && maxWidth > 0 && textWidth(candidate) > maxWidth) {
				lines.push(line);
				line = word;
			} else line = candidate;
		}
		lines.push(line);
	}
	return lines.filter((line) => line.length > 0);
}

/**
 * CSS font of a `text-font` entry. The style names a font file such as `Noto Sans Bold`,
 * which is split into the family and its weight and style.
 */
export function cssFont(fontStack: unknown): Attrs {
	const name = Array.isArray(fontStack) && typeof fontStack[0] === 'string' ? fontStack[0] : '';
	const bold = /\b(bold|black|heavy)\b/i.test(name);
	const italic = /\b(italic|oblique)\b/i.test(name);
	const family = name
		.replace(/\b(regular|bold|black|heavy|medium|light|italic|oblique|semibold|book)\b/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
	return {
		'font-family': family ? `'${family}', sans-serif` : 'sans-serif',
		'font-weight': bold ? 'bold' : undefined,
		'font-style': italic ? 'italic' : undefined
	};
}

function transformText(text: string, transform: string) {
	if (transform === 'uppercase') return text.toUpperCase();
	if (transform === 'lowercase') return text.toLowerCase();
	return text;
}

/** Center of the bounding box of the points */
function center(points: Point[]): Point {
	const xs = points.map((point) => point.x);
	const ys = points.map((point) => point.y);
	return {
		x: (Math.min(...xs) + Math.max(...xs)) / 2,
		y: (Math.min(...ys) + Math.max(...ys)) / 2
	};
}

/** Points a symbol is placed at when it does not follow a line */
function anchors(feature: QueriedFeature, ctx: RenderContext): Point[] {
	const { geometry, tile } = feature;
	if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
		const positions = geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates;
		return (
			positions
				// drop the copies which neighbouring tiles hold in their buffers
				.filter((position) => !tile || isInTile(position, tile))
				.map((position) => ctx.project([position[0], position[1]]))
		);
	}
	const points = geometryToPoints(geometry, ctx.project);
	return points.length > 0 ? [center(points)] : [];
}

/** Draw the icon of a symbol at a point */
function renderIcon(feature: QueriedFeature, at: Point, ctx: RenderContext) {
	const p = properties<'symbol'>(feature.layer);
	const name = imageName(p.layout('icon-image'));
	if (!name) return undefined;
	const tint = toCssColor(p.paint('icon-color'));
	const opacity = p.paint('icon-opacity', 1);
	const image = ctx.images.image(name, tint.color);
	if (!image || opacity <= 0) return undefined;

	const size = p.layout('icon-size', 1);
	const [offsetX, offsetY] = p.layout('icon-offset', [0, 0]);
	const anchor = p.layout('icon-anchor', 'center');
	const ax = anchor.includes('left') ? 0 : anchor.includes('right') ? 1 : 0.5;
	const ay = anchor.includes('top') ? 0 : anchor.includes('bottom') ? 1 : 0.5;
	const rotate = p.layout('icon-rotate', 0);

	const transform = [
		`translate(${fmt(at.x)} ${fmt(at.y)})`,
		rotate ? `rotate(${fmt(rotate)})` : '',
		size !== 1 ? `scale(${fmt(size)})` : '',
		`translate(${fmt(offsetX - image.width * ax)} ${fmt(offsetY - image.height * ay)})`
	]
		.filter(Boolean)
		.join(' ');
	return el(ctx.doc, 'use', {
		href: `#${image.id}`,
		transform,
		opacity: opacity === 1 ? undefined : opacity
	});
}

/** Attributes all texts of a feature share */
function textStyle(feature: QueriedFeature) {
	const p = properties<'symbol'>(feature.layer);
	const size = p.layout('text-size', 16);
	const fill = toCssColor(p.paint('text-color'));
	const opacity = p.paint('text-opacity', 1);
	const halo = toCssColor(p.paint('text-halo-color'), 'rgba(0,0,0,0)');
	const haloWidth = p.paint('text-halo-width', 0);
	const spacing = p.layout('text-letter-spacing', 0) * size;

	const base: Attrs = {
		...cssFont(p.layout('text-font')),
		'font-size': size,
		'letter-spacing': spacing ? spacing : undefined
	};
	const text: Attrs = {
		fill: fill.color,
		'fill-opacity': opacity * fill.opacity === 1 ? undefined : opacity * fill.opacity
	};
	// the halo is a copy of the text below it, stroked in the halo color. `paint-order`
	// would do the same with one element, but few editors and converters know it.
	const haloAttrs: Attrs | undefined =
		haloWidth > 0 && halo.opacity > 0
			? {
					fill: 'none',
					stroke: halo.color,
					'stroke-width': haloWidth * 2,
					'stroke-linejoin': 'round',
					'stroke-opacity': opacity * halo.opacity === 1 ? undefined : opacity * halo.opacity
				}
			: undefined;
	return { size, base, text, halo: haloAttrs, visible: opacity > 0 && size > 0 };
}

/** Draw the text of a symbol at a point */
function renderPointText(feature: QueriedFeature, at: Point, ctx: RenderContext) {
	const p = properties<'symbol'>(feature.layer);
	const style = textStyle(feature);
	const content = transformText(textOf(p.layout('text-field')), p.layout('text-transform', 'none'));
	const lines = wrapText(content, p.layout('text-max-width', 10));
	if (!style.visible || lines.length === 0) return undefined;

	const { size } = style;
	const variable = p.layout('text-variable-anchor');
	const anchor: string =
		Array.isArray(variable) && typeof variable[0] === 'string'
			? variable[0]
			: p.layout('text-anchor', 'center');
	const [offsetX, offsetY] = p.layout('text-offset', [0, 0]);
	const lineHeight = p.layout('text-line-height', 1.2) * size;
	const blockHeight = lineHeight * lines.length;

	const x = at.x + offsetX * size;
	const top =
		at.y +
		offsetY * size -
		(anchor.includes('top') ? 0 : anchor.includes('bottom') ? blockHeight : blockHeight / 2);
	const firstBaseline = top + lineHeight / 2 + size * BASELINE_SHIFT;
	const rotate = p.layout('text-rotate', 0);

	const attrs: Attrs = {
		...style.base,
		'text-anchor': anchor.includes('left') ? 'start' : anchor.includes('right') ? 'end' : 'middle',
		transform: rotate ? `rotate(${fmt(rotate)} ${fmt(at.x)} ${fmt(at.y)})` : undefined
	};
	const build = (extra: Attrs) =>
		el(
			ctx.doc,
			'text',
			{ ...attrs, ...extra },
			lines.map((line, index) => {
				const tspan = el(ctx.doc, 'tspan', { x, y: firstBaseline + index * lineHeight });
				tspan.textContent = line;
				return tspan;
			})
		);
	return style.halo ? [build(style.halo), build(style.text)] : [build(style.text)];
}

/** Draw the text of a symbol along a line */
function renderLineText(feature: QueriedFeature, path: Path, ctx: RenderContext, id: string) {
	const p = properties<'symbol'>(feature.layer);
	const style = textStyle(feature);
	const content = transformText(
		textOf(p.layout('text-field')),
		p.layout('text-transform', 'none')
	).replace(/\n/g, ' ');
	if (!style.visible || !content) return undefined;
	// the map only places a label where the line is long enough for it
	if (pathLength(path.points) < textWidth(content) * style.size) return undefined;

	// keep the text upright
	const first = path.points[0];
	const last = path.points[path.points.length - 1];
	const points = first.x <= last.x ? path.points : [...path.points].reverse();
	ctx.defs.appendChild(
		el(ctx.doc, 'path', { id, d: pathData([{ points, closed: false }]), fill: 'none' })
	);

	const build = (extra: Attrs) => {
		const textPath = el(ctx.doc, 'textPath', { href: `#${id}`, startOffset: '50%' });
		textPath.textContent = content;
		return el(
			ctx.doc,
			'text',
			{ ...style.base, 'text-anchor': 'middle', dy: style.size * BASELINE_SHIFT, ...extra },
			[textPath]
		);
	};
	return style.halo ? [build(style.halo), build(style.text)] : [build(style.text)];
}

/**
 * Draw a symbol layer as editable text and icons.
 *
 * The map does not tell where it placed a symbol, so the position is derived from the
 * geometry of its feature: point labels are anchored at the feature, and labels along a
 * line are centered on the part of the line which lies in each tile.
 */
export function renderSymbol(layer: StyleLayer, features: QueriedFeature[], ctx: RenderContext) {
	const group = layerGroup(ctx, layer);
	const seen = new Set<string>();
	let pathCount = 0;

	for (const feature of features) {
		const p = properties<'symbol'>(feature.layer);
		const identity = `${feature.id ?? ''}|${JSON.stringify(feature.properties)}`;
		const elements: Element[] = [];

		if (p.layout('symbol-placement', 'point') === 'point') {
			for (const at of anchors(feature, ctx)) {
				const key = `${identity}@${fmt(at.x)},${fmt(at.y)}`;
				if (seen.has(key)) continue;
				seen.add(key);
				const icon = renderIcon(feature, at, ctx);
				if (icon) elements.push(icon);
				elements.push(...(renderPointText(feature, at, ctx) ?? []));
			}
		} else {
			const paths = geometryToPaths(feature.geometry, ctx.project).filter(
				(path) => path.points.length > 1
			);
			// one label per feature and tile, on its longest part
			const longest = paths.sort((a, b) => pathLength(b.points) - pathLength(a.points))[0];
			if (longest) {
				const id = ctx.id(`${layer.id}-path-${pathCount++}`);
				elements.push(...(renderLineText(feature, longest, ctx, id) ?? []));
			}
		}

		if (elements.length === 1) group.appendChild(elements[0]);
		else if (elements.length > 1) group.appendChild(el(ctx.doc, 'g', {}, elements));
	}
	return group.childNodes.length > 0 ? group : undefined;
}
