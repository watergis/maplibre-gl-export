import { toCssColor } from '../color';
import { imageName } from '../pattern';
import { el } from '../svg';
import { properties, type LayerOfType } from '../style';
import { layerGroup, type RenderContext } from './common';

/**
 * Draw a background layer. It has no features, so its properties are read from the style
 * and only literal values can be used.
 */
export function renderBackground(layer: LayerOfType<'background'>, ctx: RenderContext) {
	const p = properties<'background'>(layer);
	const opacity = p.paint('background-opacity', 1);
	const pattern = imageName(p.paint('background-pattern'));
	const patternId = pattern ? ctx.images.pattern(pattern) : undefined;
	const { color, opacity: alpha } = toCssColor(p.paint('background-color'));

	const fillOpacity = (typeof opacity === 'number' ? opacity : 1) * (patternId ? 1 : alpha);
	if (fillOpacity <= 0) return undefined;

	const group = layerGroup(ctx, layer);
	group.appendChild(
		el(ctx.doc, 'rect', {
			width: ctx.width,
			height: ctx.height,
			fill: patternId ? `url(#${patternId})` : color,
			'fill-opacity': fillOpacity === 1 ? undefined : fillOpacity
		})
	);
	return group;
}
