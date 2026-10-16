import { toCssColor } from '../color';
import { geometryToPaths, offsetPath, pathData } from '../geometry';
import { fmt, type Attrs } from '../svg';
import { properties, type StyleLayer } from '../style';
import type { QueriedFeature } from '../types';
import { renderPathLayer, translatedProject, type RenderContext } from './common';

/**
 * Dash pattern of a line in pixels. `line-dasharray` is given in multiples of the line
 * width, and it is a pair of patterns while the map fades from one zoom level to the next.
 */
export function dashArray(value: unknown, width: number): string | undefined {
	const dashes = Array.isArray(value)
		? value
		: ((value as { from?: unknown; to?: unknown } | undefined)?.from ??
			(value as { to?: unknown } | undefined)?.to);
	if (!Array.isArray(dashes) || dashes.length < 2) return undefined;
	if (!dashes.every((dash) => typeof dash === 'number')) return undefined;
	return dashes.map((dash) => fmt(Math.max(0, dash * width))).join(' ');
}

/** Attributes of the `<path>` a line feature is drawn with, or undefined when it is invisible */
export function lineAttrs(feature: QueriedFeature, ctx: RenderContext): Attrs | undefined {
	const p = properties<'line'>(feature.layer);
	const width = p.paint('line-width', 1);
	const stroke = toCssColor(p.paint('line-color'));
	const opacity = p.paint('line-opacity', 1) * stroke.opacity;
	if (width <= 0 || opacity <= 0) return undefined;

	const project = translatedProject(
		ctx,
		p.paint('line-translate', [0, 0]),
		p.paint('line-translate-anchor', 'map')
	);
	const offset = p.paint('line-offset', 0);
	const gapWidth = p.paint('line-gap-width', 0);
	// a gap turns the line into two lines, one on each side of it
	const offsets =
		gapWidth > 0 ? [offset - (gapWidth + width) / 2, offset + (gapWidth + width) / 2] : [offset];

	const paths = geometryToPaths(feature.geometry, project);
	const d = pathData(offsets.flatMap((by) => paths.map((path) => offsetPath(path, by))));
	if (!d) return undefined;

	const join = p.layout('line-join', 'miter');
	return {
		d,
		fill: 'none',
		stroke: stroke.color,
		'stroke-width': width,
		'stroke-opacity': opacity === 1 ? undefined : opacity,
		'stroke-linecap': p.layout('line-cap', 'butt'),
		'stroke-linejoin': join,
		'stroke-miterlimit': join === 'miter' ? p.layout('line-miter-limit', 2) : undefined,
		'stroke-dasharray': dashArray(p.paint('line-dasharray'), width)
	};
}

/** Draw a line layer */
export function renderLine(layer: StyleLayer, features: QueriedFeature[], ctx: RenderContext) {
	return renderPathLayer(layer, features, ctx, lineAttrs);
}
