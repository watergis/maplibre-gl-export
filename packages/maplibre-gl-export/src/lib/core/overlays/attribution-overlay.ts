import type { AttributionOptions } from '../../interfaces';
import { ControlElementOverlay } from './control-element-overlay';
import { createSvgNode, FONT_FAMILY, PADDING, type OverlayLayout } from './map-element-overlay';
import type { ScalebarOverlay } from './scalebar-overlay';

/**
 * Narrowest the attribution may become, as a ratio of the page width, to leave room for the
 * scale bar beside it. The scale bar is stacked over the attribution when it would be narrower.
 */
const MIN_ATTRIBUTION_WIDTH_RATIO = 0.4;

/**
 * Split the text of an element into the lines it is wrapped into by the browser, so that
 * the SVG text can be wrapped the same way.
 */
export function getWrappedLines(element: HTMLElement) {
	const lines: { top: number; words: string[] }[] = [];
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const content = node.textContent ?? '';
		const regex = /\S+/g;
		for (let match = regex.exec(content); match; match = regex.exec(content)) {
			range.setStart(node, match.index);
			range.setEnd(node, match.index + match[0].length);
			const top = range.getBoundingClientRect().top;
			const last = lines[lines.length - 1];
			// words at the same height as the current line belong to it, others start a new line
			if (last && Math.abs(top - last.top) < 1) last.words.push(match[0]);
			else lines.push({ top, words: [match[0]] });
		}
	}
	return lines.map((line) => line.words.join(' '));
}

/** Attribution of the map, made from the attribution control of the hidden map */
export class AttributionOverlay extends ControlElementOverlay<AttributionOptions> {
	protected readonly name = 'attribution';

	protected readonly defaultPosition = 'bottom-right';

	/**
	 * Limit the width of the attribution control so that it wraps inside of the page instead of
	 * spreading over its whole width. When the scale bar sits in the other corner of the same
	 * edge, the attribution is narrowed to leave room for it, unless that makes it too narrow,
	 * in which case the scale bar is stacked over the attribution instead.
	 * It has to run before the controls are measured, both for the canvas and the vector SVG.
	 * @param pageWidth width of the page in CSS pixels
	 * @param scalebar scale bar drawn on the same page
	 */
	fitWidth(pageWidth: number, scalebar: ScalebarOverlay) {
		if (!this.visible || !this.element || !pageWidth) return;

		const margin = this.options.margin ?? 10;
		const fullWidth = pageWidth - 2 * margin;
		let maxWidth = fullWidth;

		if (scalebar.visible && scalebar.element) {
			const sameEdge = this.position.split('-')[0] === scalebar.position.split('-')[0];
			if (sameEdge && this.position !== scalebar.position) {
				const besideScalebar = fullWidth - scalebar.element.offsetWidth - scalebar.margin();
				if (besideScalebar >= pageWidth * MIN_ATTRIBUTION_WIDTH_RATIO) maxWidth = besideScalebar;
			}
		}

		// the padding is counted in the width, so that the control never exceeds `maxWidth`
		this.element.style.boxSizing = 'border-box';
		this.element.style.maxWidth = `${Math.max(maxWidth, 0)}px`;
	}

	/** Draw the attribution as lines of text on a translucent box, like the attribution control */
	protected createElement(layout: OverlayLayout) {
		if (!this.element) return undefined;
		const lines = getWrappedLines(this.element);
		// nothing is drawn, so the scale bar does not have to avoid it
		if (lines.length === 0) return undefined;
		const box = this.place(layout, this.element.offsetWidth, this.element.offsetHeight);

		const fontSize = 12;
		const lineHeight = box.height / lines.length;
		const group = createSvgNode('g', { 'data-overlay': 'attribution' });
		group.appendChild(createSvgNode('rect', { ...box, fill: '#ffffff', 'fill-opacity': 0.5 }));
		const text = createSvgNode('text', {
			'font-family': FONT_FAMILY,
			'font-size': fontSize,
			fill: '#000000',
			'fill-opacity': 0.75
		});
		lines.forEach((line, i) => {
			text.appendChild(
				createSvgNode(
					'tspan',
					{
						x: box.x + PADDING,
						y: box.y + lineHeight * (i + 0.5) + fontSize * 0.35
					},
					line
				)
			);
		});
		group.appendChild(text);
		return group as SVGGElement;
	}
}
