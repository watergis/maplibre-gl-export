import { toCssColor } from '../color';
import { geometryToPaths, pathData } from '../geometry';
import { imageName } from '../pattern';
import type { Attrs } from '../svg';
import { properties, type StyleLayer } from '../style';
import type { QueriedFeature } from '../types';
import { renderPathLayer, translatedProject, type RenderContext } from './common';

/** Attributes of the `<path>` a fill feature is drawn with, or undefined when it is invisible */
export function fillAttrs(feature: QueriedFeature, ctx: RenderContext): Attrs | undefined {
	const p = properties<'fill'>(feature.layer);
	const opacity = p.paint('fill-opacity', 1);
	if (opacity <= 0) return undefined;

	const project = translatedProject(
		ctx,
		p.paint('fill-translate', [0, 0]),
		p.paint('fill-translate-anchor', 'map')
	);
	const d = pathData(geometryToPaths(feature.geometry, project));
	if (!d) return undefined;

	const pattern = imageName(p.paint('fill-pattern'));
	const patternId = pattern ? ctx.images.pattern(pattern) : undefined;
	const fill = toCssColor(p.paint('fill-color'));
	const fillOpacity = opacity * (patternId ? 1 : fill.opacity);

	const attrs: Attrs = {
		d,
		fill: patternId ? `url(#${patternId})` : fill.color,
		'fill-opacity': fillOpacity === 1 ? undefined : fillOpacity,
		// holes are told apart from outer rings by their winding order only
		'fill-rule': 'evenodd'
	};

	// the map outlines every antialiased fill in its own color by default, which only
	// smooths its edge. An outline is drawn here when it has a color of its own.
	const outline = p.paint('fill-outline-color');
	if (outline !== undefined && outline !== null && p.paint('fill-antialias', true)) {
		const stroke = toCssColor(outline);
		const strokeOpacity = opacity * stroke.opacity;
		if (strokeOpacity > 0) {
			attrs.stroke = stroke.color;
			attrs['stroke-width'] = 1;
			attrs['stroke-opacity'] = strokeOpacity === 1 ? undefined : strokeOpacity;
		}
	}
	return attrs;
}

/** Draw a fill layer */
export function renderFill(layer: StyleLayer, features: QueriedFeature[], ctx: RenderContext) {
	return renderPathLayer(layer, features, ctx, fillAttrs);
}
