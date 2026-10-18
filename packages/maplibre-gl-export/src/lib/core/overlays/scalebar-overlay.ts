import type { ScalebarOptions } from '../../interfaces';
import { ControlElementOverlay } from './control-element-overlay';
import { createSvgNode, FONT_FAMILY, PADDING, type OverlayLayout } from './map-element-overlay';

/** Scale bar of the map, made from the scale control of the hidden map */
export class ScalebarOverlay extends ControlElementOverlay<ScalebarOptions> {
	protected readonly name = 'scale bar';

	protected readonly defaultPosition = 'bottom-left';

	/** Draw the scale bar as the scale control draws it: a box which is open at the top */
	protected createElement(layout: OverlayLayout) {
		if (!this.element) return undefined;
		const box = this.place(layout, this.element.offsetWidth, this.element.offsetHeight);

		const border = 2;
		const fontSize = 10;
		const { x, y, width, height } = box;
		const group = createSvgNode('g', { 'data-overlay': 'scalebar' });
		group.appendChild(createSvgNode('rect', { ...box, fill: '#ffffff', 'fill-opacity': 0.75 }));
		group.appendChild(
			createSvgNode('path', {
				// the stroke is kept inside of the box
				d: `M${x + border / 2} ${y}V${y + height - border / 2}H${x + width - border / 2}V${y}`,
				fill: 'none',
				stroke: '#333333',
				'stroke-width': border
			})
		);
		group.appendChild(
			createSvgNode(
				'text',
				{
					x: x + border + PADDING,
					y: y + (height - border) / 2 + fontSize * 0.35,
					'font-family': FONT_FAMILY,
					'font-size': fontSize,
					fill: '#333333'
				},
				this.element.textContent?.trim() ?? ''
			)
		);
		return group as SVGGElement;
	}
}
