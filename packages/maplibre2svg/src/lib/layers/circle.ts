import type { Geometry, Position } from 'geojson';
import { toCssColor } from '../color';
import { el, fmt, hoistCommonAttrs, type Attrs } from '../svg';
import { isInTile } from '../tile-clip';
import { properties, type StyleLayer } from '../style';
import type { QueriedFeature } from '../types';
import { layerGroup, translatedProject, type RenderContext } from './common';

/** Every vertex of a geometry: a circle layer draws a circle at each of them */
function positions(geometry: Geometry): Position[] {
	switch (geometry.type) {
		case 'Point':
			return [geometry.coordinates];
		case 'MultiPoint':
		case 'LineString':
			return geometry.coordinates;
		case 'MultiLineString':
		case 'Polygon':
			return geometry.coordinates.flat();
		case 'MultiPolygon':
			return geometry.coordinates.flat(2);
		case 'GeometryCollection':
			return geometry.geometries.flatMap(positions);
		default:
			return [];
	}
}

/** Attributes of the `<circle>` elements a circle feature is drawn with */
export function circleAttrs(feature: QueriedFeature, ctx: RenderContext): Attrs[] {
	const p = properties<'circle'>(feature.layer);
	const radius = p.paint('circle-radius', 5);
	const fill = toCssColor(p.paint('circle-color'));
	const fillOpacity = p.paint('circle-opacity', 1) * fill.opacity;
	const strokeWidth = p.paint('circle-stroke-width', 0);
	const stroke = toCssColor(p.paint('circle-stroke-color'));
	const strokeOpacity = strokeWidth > 0 ? p.paint('circle-stroke-opacity', 1) * stroke.opacity : 0;
	if (radius + strokeWidth <= 0 || (fillOpacity <= 0 && strokeOpacity <= 0)) return [];

	const project = translatedProject(
		ctx,
		p.paint('circle-translate', [0, 0]),
		p.paint('circle-translate-anchor', 'map')
	);
	// circles are not clipped to their tile. The copies which neighbouring tiles hold in
	// their buffers are dropped instead, as the map does.
	const { tile } = feature;

	return positions(feature.geometry)
		.filter((position) => !tile || isInTile(position, tile))
		.map((position) => {
			const point = project([position[0], position[1]]);
			return {
				cx: point.x,
				cy: point.y,
				// the stroke of the map lies outside of the radius, the one of SVG is centered on it
				r: radius + strokeWidth / 2,
				fill: fillOpacity > 0 ? fill.color : 'none',
				'fill-opacity': fillOpacity > 0 && fillOpacity < 1 ? fillOpacity : undefined,
				stroke: strokeOpacity > 0 ? stroke.color : undefined,
				'stroke-width': strokeOpacity > 0 ? strokeWidth : undefined,
				'stroke-opacity': strokeOpacity > 0 && strokeOpacity < 1 ? strokeOpacity : undefined
			};
		});
}

/** Draw a circle layer */
export function renderCircle(layer: StyleLayer, features: QueriedFeature[], ctx: RenderContext) {
	const seen = new Set<string>();
	const all = features
		.flatMap((feature) =>
			circleAttrs(feature, ctx).map((attrs) => ({
				attrs,
				key: `${feature.id ?? JSON.stringify(feature.properties)}@${fmt(attrs.cx as number)},${fmt(attrs.cy as number)}`
			}))
		)
		// features without a known tile cannot be told apart from their copies otherwise
		.filter(({ key }) => !seen.has(key) && seen.add(key))
		.map(({ attrs }) => attrs);
	if (all.length === 0) return undefined;

	const group = layerGroup(ctx, layer);
	hoistCommonAttrs(group, all, ['cx', 'cy', 'r']);
	for (const attrs of all) group.appendChild(el(ctx.doc, 'circle', attrs));
	return group;
}
